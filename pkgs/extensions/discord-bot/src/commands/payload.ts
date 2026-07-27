/**
 * The bot's slash-command definitions — the single source of truth.
 *
 * Two places register commands with Discord, and they must send the *same*
 * payload:
 *
 *   - `scripts/register-commands.ts` — manual CLI, for guilds that were
 *     invited with a plain OAuth URL.
 *   - `src/api/install/callback.ts` — the frontend-initiated install flow,
 *     which registers automatically right after binding the guild.
 *
 * They used to hold two hand-maintained copies, which silently drifted: the
 * install-flow copy was missing `/thx address` and the `amount` minimum, so
 * guilds onboarded through the frontend got a command that `commands/thx.ts`
 * could handle but nobody could invoke. Both now import this module, so a new
 * option can only be added in one place.
 *
 * Registration is `PUT .../commands`, i.e. a full replacement — whatever is
 * here becomes the guild's entire command list.
 *
 * Option `type` values (Discord application command option types):
 *   1 = SUB_COMMAND, 3 = STRING, 4 = INTEGER, 6 = USER
 */

/** Command `type` 1 = CHAT_INPUT (slash command). */
export const COMMANDS_PAYLOAD = [
  {
    name: "toban-setup",
    description: "ウォレットと Discord アカウントを連携するリンクを発行します",
    type: 1,
  },
  {
    name: "toban-link",
    description: "(管理者向け) このサーバーを Toban ワークスペースに連携します",
    type: 1,
    options: [
      {
        name: "workspace_url",
        description: "Toban のワークスペース URL（例: https://toban.xyz/3002）",
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: "balance",
    description: "Bot への許可枠と送信可能枠を表示します",
    type: 1,
  },
  {
    name: "thx",
    description: "他のメンバーに THX を送ります",
    type: 1,
    options: [
      // Discord requires `required: true` options to come before optional
      // ones, so amount sits at the top.
      {
        name: "amount",
        description: "THX の量（1 以上の整数）",
        type: 4,
        required: true,
        min_value: 1,
      },
      {
        name: "user",
        description: "送り先（このサーバーのメンバーから選択）",
        type: 6,
        required: true,
      },
      {
        name: "address",
        description:
          "上書き指定: 連携済みウォレットの代わりに、この 0x アドレス / ENS 名へ送ります",
        type: 3,
        required: false,
      },
      {
        name: "message",
        description: "感謝のメッセージ（任意）",
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: "quest",
    description: "クエスト関連の操作",
    type: 1,
    options: [
      {
        name: "submit",
        description: "取り組めるクエストの完了を報告します",
        type: 1, // SUB_COMMAND
        options: [
          {
            name: "quest",
            description: "完了報告するクエストを選択",
            type: 3, // STRING
            required: true,
            autocomplete: true,
          },
        ],
      },
    ],
  },
] as const;
