/**
 * /quest submit quest:<autocomplete>
 *
 * Proxy quest-completion submission. The Discord bot, wearing the workspace's
 * `questAgentHat`, calls `submitCompletion(actorWallet, questId, membershipHatId)`
 * so a member can declare a quest complete without any wallet operation —
 * mirroring how `/thx` proxies `mintFrom`.
 *
 * Two interaction surfaces share this module:
 *   - Autocomplete (interaction type 4): {@link handleQuestAutocomplete}
 *     returns the Open quests the actor may submit, filtered by the partial
 *     input. Must answer within Discord's 3s budget (no defer possible).
 *   - Command (interaction type 2): {@link executeQuestSubmit} runs after the
 *     caller deferred (ephemeral), resolves the actor + membership + quest
 *     module (plus the quest title, so the confirmation names the quest the
 *     way the picker did), signs via Turnkey, and reports it as a followup.
 */
import {
  type APIApplicationCommandAutocompleteInteraction,
  type APIApplicationCommandInteractionDataOption,
  type APIChatInputApplicationCommandInteraction,
  ApplicationCommandOptionType,
} from "discord-api-types/v10";
import {
  http,
  type Address,
  type Hex,
  type LocalAccount,
  createWalletClient,
} from "viem";
import {
  HATS_QUEST_MODULE_ABI,
  type SubmittableQuest,
  getChain,
  resolveMembershipHatId,
  resolveQuestModuleAddress,
  resolveSubmittableQuests,
} from "../chain";
import type { Env } from "../env";
import { type IdentityClient, createIdentityClient } from "../identity";
import { createTurnkeySigner } from "../signer/turnkey";
import { sendFollowup } from "./responses";

/** Discord caps autocomplete responses at 25 choices and 100-char names. */
const MAX_CHOICES = 25;
const MAX_NAME_LEN = 100;

/**
 * Pull the options array out of the `submit` subcommand. The bot registers
 * `/quest` with a single `submit` subcommand, so the real options live one
 * level down from `interaction.data.options`.
 */
function getSubmitOptions(
  options: APIApplicationCommandInteractionDataOption[] | undefined,
): APIApplicationCommandInteractionDataOption[] {
  const sub = (options ?? []).find(
    (o) =>
      o.type === ApplicationCommandOptionType.Subcommand && o.name === "submit",
  );
  if (sub && "options" in sub && Array.isArray(sub.options)) {
    return sub.options;
  }
  // Tolerate a flat (non-subcommand) shape too, so a future registration
  // change doesn't silently break parsing.
  return options ?? [];
}

/**
 * Display label for a quest — the title alone, so both the autocomplete
 * choice and the completion followup name the quest the way the workspace
 * does. Falls back to the id only when the title isn't indexed yet.
 * Clamped to Discord's 100-char autocomplete limit.
 */
export function questChoiceLabel(quest: SubmittableQuest): string {
  const base = quest.title?.trim()
    ? quest.title.trim()
    : `クエスト #${quest.questId}`;
  // Truncate by Unicode code point, not UTF-16 code unit: `String.slice` can
  // cut an emoji/astral char mid-surrogate, and the resulting lone surrogate
  // makes Discord reject the ENTIRE autocomplete response (400), so the user
  // sees no suggestions at all. `Array.from` iterates by code point.
  const chars = Array.from(base);
  return chars.length > MAX_NAME_LEN
    ? `${chars.slice(0, MAX_NAME_LEN - 1).join("")}…`
    : base;
}

/**
 * Build the autocomplete choice list: substring-filter by the partial input
 * (case-insensitive over title and id), then cap at 25.
 */
export function buildQuestChoices(
  quests: SubmittableQuest[],
  query: string,
): Array<{ name: string; value: string }> {
  const q = query.trim().toLowerCase();
  const matches = q
    ? quests.filter(
        (quest) =>
          (quest.title ?? "").toLowerCase().includes(q) ||
          quest.questId.toString().includes(q),
      )
    : quests;
  return matches.slice(0, MAX_CHOICES).map((quest) => ({
    name: questChoiceLabel(quest),
    value: quest.questId.toString(),
  }));
}

export interface QuestSubmitDeps {
  identity?: IdentityClient;
  signer?: LocalAccount;
  /** Resolve `treeId -> HatsQuestModule address`. Tests inject a stub. */
  resolveQuestModule?: (treeId: string) => Promise<Hex | null>;
  /** Resolve the actor's membership hat id. Tests inject a stub. */
  resolveMembershipHatId?: (
    wallet: Address,
    treeId: string,
  ) => Promise<bigint | null>;
  /** Resolve the workspace's submittable Open quests. Tests inject a stub. */
  resolveSubmittableQuests?: (
    treeId: string,
    actor: Address,
  ) => Promise<SubmittableQuest[]>;
  /** Inject the followup sender for tests. */
  followup?: (appId: string, token: string, content: string) => Promise<void>;
}

/** Autocomplete response payload (interaction response type 8). */
export interface AutocompleteResult {
  type: 8;
  data: { choices: Array<{ name: string; value: string }> };
}

/**
 * Handle the `quest` autocomplete. Resolves the actor's wallet + membership
 * and lists the Open quests they may submit. Returns an empty choice list
 * (never throws to the caller) for every "can't submit" case — unlinked
 * wallet, non-member, indexing lag — so the user just sees no suggestions and
 * the execute path delivers the actionable guidance.
 */
export async function handleQuestAutocomplete(
  env: Env,
  interaction: APIApplicationCommandAutocompleteInteraction,
  deps: QuestSubmitDeps = {},
): Promise<AutocompleteResult> {
  const empty: AutocompleteResult = { type: 8, data: { choices: [] } };
  try {
    const guildId = interaction.guild_id;
    const actorSf = interaction.member?.user.id ?? interaction.user?.id ?? "";
    if (!guildId || !actorSf) return empty;

    const options = getSubmitOptions(interaction.data?.options);
    const focused = options.find(
      (o) => "focused" in o && o.focused && o.name === "quest",
    );
    const query =
      focused && "value" in focused && typeof focused.value === "string"
        ? focused.value
        : "";

    const identity = deps.identity ?? createIdentityClient(env);
    const [actor, platformLink] = await Promise.all([
      identity.getIdentity("discord", actorSf),
      identity.getPlatformLink("discord", guildId),
    ]);
    if (!actor || !platformLink) return empty;

    const resolveMembership =
      deps.resolveMembershipHatId ??
      ((wallet: Address, treeId: string) =>
        resolveMembershipHatId(env, wallet, treeId));
    const resolveQuests =
      deps.resolveSubmittableQuests ??
      ((treeId: string, a: Address) =>
        resolveSubmittableQuests(env, treeId, a));

    const actorWallet = actor.wallet as Address;
    const [membershipHatId, quests] = await Promise.all([
      resolveMembership(actorWallet, platformLink.treeId),
      resolveQuests(platformLink.treeId, actorWallet),
    ]);
    // Not a workspace member → nothing is submittable on their behalf.
    if (membershipHatId === null) return empty;

    return { type: 8, data: { choices: buildQuestChoices(quests, query) } };
  } catch (err) {
    console.error("quest autocomplete failed:", err);
    return empty;
  }
}

/** Parse the chosen `questId` from a `/quest submit` command interaction. */
export function parseQuestSubmitArgs(
  interaction: APIChatInputApplicationCommandInteraction,
): { questId: bigint } | { error: string } {
  const options = getSubmitOptions(interaction.data?.options);
  const opt = options.find((o) => o.name === "quest");
  const raw =
    opt && "value" in opt
      ? (opt.value as string | number | undefined)
      : undefined;
  if (raw === undefined || `${raw}`.length === 0) {
    return { error: "`quest` は必須です。" };
  }
  try {
    return { questId: BigInt(raw) };
  } catch {
    return { error: `クエスト ID の形式が正しくありません: ${raw}` };
  }
}

/**
 * Map a `submitCompletion` revert into an actionable message. The autocomplete
 * list is built from the subgraph, which can lag the chain, so a quest that
 * looked submittable can still revert on-chain — translate the common reverts
 * instead of surfacing the raw `NotWorkspaceMember()` / `InvalidStatus()`.
 */
export function describeSubmitRevert(short: string): string {
  if (short.includes("NotWorkspaceMember")) {
    return "ワークスペースのメンバーシップをオンチェーンで確認できませんでした。クエスト一覧を表示してからロールが変更された可能性があります。管理者にロールを確認してもらってから、再度お試しください。";
  }
  if (short.includes("InvalidStatus")) {
    return "このクエストは完了報告できません（他の人が報告済み、またはキャンセルされた可能性があります）。別のクエストを選んで再度お試しください。";
  }
  if (short.includes("CannotSubmitOwnQuest")) {
    return "自分が作成したクエストには完了報告できません。";
  }
  return `submitCompletion に失敗しました: ${short}`;
}

/**
 * Execute `/quest submit` end-to-end. Runs inside `ctx.waitUntil(...)` after
 * the interaction was deferred (ephemeral), so — like `/thx` — every failure
 * path must end in a followup or the interaction hangs on "thinking…".
 */
export async function executeQuestSubmit(
  env: Env,
  interaction: APIChatInputApplicationCommandInteraction,
  deps: QuestSubmitDeps = {},
): Promise<void> {
  const followup = deps.followup ?? sendFollowup;
  try {
    await executeQuestSubmitInner(env, interaction, deps, followup);
  } catch (err) {
    console.error("executeQuestSubmit unhandled:", err);
    try {
      await followup(
        env.DISCORD_APP_ID,
        interaction.token,
        "`/quest submit` の処理中にエラーが発生しました。少し時間をおいて再度お試しください。",
      );
    } catch (followupErr) {
      console.error("quest-submit followup-after-error failed:", followupErr);
    }
  }
}

async function executeQuestSubmitInner(
  env: Env,
  interaction: APIChatInputApplicationCommandInteraction,
  deps: QuestSubmitDeps,
  followup: NonNullable<QuestSubmitDeps["followup"]>,
): Promise<void> {
  const actorSf = interaction.member?.user.id ?? interaction.user?.id ?? "";
  const parsed = parseQuestSubmitArgs(interaction);
  if ("error" in parsed) {
    await followup(env.DISCORD_APP_ID, interaction.token, parsed.error);
    return;
  }

  const guildId = interaction.guild_id;
  if (!guildId) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      "このコマンドはサーバー内で実行してください。",
    );
    return;
  }

  const identity = deps.identity ?? createIdentityClient(env);
  const [actor, platformLink] = await Promise.all([
    identity.getIdentity("discord", actorSf),
    identity.getPlatformLink("discord", guildId),
  ]);
  if (!actor) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      "ウォレットが連携されていません。先に `/toban-setup` を実行してください。",
    );
    return;
  }
  if (!platformLink) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      "このサーバーはまだ Toban ワークスペースに連携されていません。管理者に `/toban-link` の実行を依頼してください。",
    );
    return;
  }

  const actorWallet = actor.wallet as Address;
  const resolveMembership =
    deps.resolveMembershipHatId ??
    ((wallet: Address, treeId: string) =>
      resolveMembershipHatId(env, wallet, treeId));
  const resolveModule =
    deps.resolveQuestModule ??
    ((treeId: string) => resolveQuestModuleAddress(env, treeId));
  const resolveQuests =
    deps.resolveSubmittableQuests ??
    ((treeId: string, a: Address) => resolveSubmittableQuests(env, treeId, a));

  const [membershipHatId, questModule] = await Promise.all([
    resolveMembership(actorWallet, platformLink.treeId),
    resolveModule(platformLink.treeId),
  ]);
  if (membershipHatId === null) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      "このワークスペースのメンバーではないため、クエストの完了報告はできません。",
    );
    return;
  }
  if (!questModule) {
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      `ワークスペースのクエストモジュールを取得できませんでした（tree ${platformLink.treeId}）。インデックス処理が完了していない可能性があります。`,
    );
    return;
  }

  // The title only names the quest in the confirmation, so start the lookup
  // here — after the gates that can reject, so failure paths cost no request —
  // and let it overlap with the transaction. `.catch` is attached before any
  // await, so it can never surface as an unhandled rejection, and a subgraph
  // hiccup degrades to the id-only label instead of failing the submission.
  const questsPromise = resolveQuests(platformLink.treeId, actorWallet).catch(
    (err) => {
      console.error("quest title lookup failed:", err);
      return [] as SubmittableQuest[];
    },
  );

  const signer = deps.signer ?? createTurnkeySigner(env);
  const wallet = createWalletClient({
    account: signer,
    chain: getChain(env),
    transport: http(env.RPC_URL),
  });

  let txHash: Hex;
  try {
    txHash = await wallet.writeContract({
      address: questModule,
      abi: HATS_QUEST_MODULE_ABI,
      functionName: "submitCompletion",
      args: [actorWallet, parsed.questId, membershipHatId],
    });
  } catch (err) {
    console.error("submitCompletion failed:", err);
    const short =
      (err as { shortMessage?: string }).shortMessage ?? (err as Error).message;
    await followup(
      env.DISCORD_APP_ID,
      interaction.token,
      describeSubmitRevert(short),
    );
    return;
  }

  const quests = await questsPromise;
  const questLabel = questChoiceLabel(
    quests.find((q) => q.questId === parsed.questId) ?? {
      questId: parsed.questId,
      title: null,
    },
  );
  await followup(
    env.DISCORD_APP_ID,
    interaction.token,
    [
      `**${questLabel}** の完了を報告しました。`,
      `報告者: \`${actorWallet}\``,
      `Tx: \`${txHash}\``,
    ].join("\n"),
  );
}
