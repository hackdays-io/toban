/**
 * `config/openclaw.template.json` + `config/guilds.json` -> `/data/openclaw.json`
 *
 * OpenClaw の設定の実体は Fly のボリューム上（`OPENCLAW_STATE_DIR=/data` なので
 * `/data/openclaw.json`）に置かれ、再起動をまたいで残る。リポジトリに素の
 * `openclaw.json` を置くと必ず実体と乖離するので、**リポジトリ側はテンプレート**に
 * 留め、デプロイのたびにここでレンダリングして送り込む。
 *
 * ## なぜスキーマをこのファイルに書かないか
 *
 * ギルドごとの agent / binding / MCP サーバーの**形はテンプレート側が持つ**
 * (`$toban.perGuild`)。このモジュールがやるのはプレースホルダの差し込みと配置、
 * そして「壊れた設定を送り込まない」ための検証だけ。OpenClaw の設定スキーマは
 * 本家の更新で変わりうるので、スキーマを TypeScript に写すとバージョン追従が
 * 二重管理になる。テンプレートなら `openclaw config` で検証して直せる。
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export type JsonObject = { [key: string]: Json };

/** `config/guilds.json` の 1 エントリ。 */
export interface GuildEntry {
  /** agent id / MCP サーバー id を組み立てるための短い識別子（kebab-case）。 */
  label: string;
  /** Discord ギルド id（snowflake）。 */
  guildId: string;
  /** このギルドにリンクされた Toban ワークスペースの Hats tree id。 */
  treeId: string;
  /** ワークスペースが載っている EVM チェーン id。 */
  chainId: number;
  /**
   * このギルドを担当する Toban MCP エンドポイント（discord-bot Worker）。
   * ギルドごとに持つのは、`platform_links` がギルド単位でワークスペース＝チェーンを
   * 決めており、チェーンが違えば Worker も違うため。
   */
  mcpUrl: string;
  /**
   * このギルドでエージェントに話しかけられる Discord ユーザー id。
   * **空にはできない** — 空だと OpenClaw 側の既定に落ちて、Bot が参加している
   * ギルドの誰にでも反応する状態になる。
   */
  allowUsers: string[];
  /** エージェントが待ち受けるチャンネル id。省略時はテンプレート側の既定に従う。 */
  channels?: string[];
}

/** テンプレートの `$toban` ブロック（レンダリング時に取り除かれる）。 */
export interface TobanTemplateBlock {
  /** 人間向けメモ。出力には残らない。 */
  notes?: string[];
  perGuild: {
    /** `agents.entries[<agentId>]` に置かれる。 */
    agent: JsonObject;
    /** ルート直下の `bindings[]` に追加される。 */
    binding: JsonObject;
    /** `mcp.servers[<mcpServerId>]` に置かれる。 */
    mcpServer: JsonObject;
    /** `channels.discord.guilds[<guildId>]` に置かれる。 */
    discordGuild: JsonObject;
  };
}

export class RenderConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RenderConfigError";
  }
}

const PLACEHOLDER = /\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}/g;

/**
 * 設定ファイルに直書きされてはいけない値の形。ここに引っかかるものは
 * `${ENV_VAR}` 参照（OpenClaw が実行時に環境変数から解決する）に直す。
 */
const SECRET_SHAPES: ReadonlyArray<{ name: string; re: RegExp }> = [
  { name: "Anthropic API key", re: /\bsk-ant-[A-Za-z0-9_-]{8,}/ },
  { name: "OpenAI API key", re: /\bsk-[A-Za-z0-9]{20,}/ },
  { name: "Slack token", re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/ },
  {
    name: "Discord bot token",
    re: /\b[A-Za-z0-9_-]{24,28}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{27,}/,
  },
  // `Bearer <リテラル>`。`Bearer ${TOKEN}` は通す。
  { name: "literal bearer token", re: /Bearer\s+(?!\$\{)[A-Za-z0-9._-]{8,}/ },
];

function isObject(v: Json): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepClone<T extends Json>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

/**
 * プレースホルダを差し込む。
 *
 * 値がまるごと `"{{key}}"` で、かつ差し込む値が**配列かオブジェクト**のときだけ
 * 型を保ったまま置き換える（`allowUsers` のような配列を入れるため）。数値・真偽値は
 * 常に文字列になる — `chainId` のような値は HTTP ヘッダや id として使われるので、
 * 型が文脈によって変わるほうが事故になる。
 *
 * 未知のキーは黙って残さずエラーにする。テンプレートの打ち間違いを本番の設定まで
 * 運ばないため。
 */
export function substitute(value: Json, vars: Record<string, Json>): Json {
  if (typeof value === "string") {
    const whole = value.match(/^\{\{([a-zA-Z][a-zA-Z0-9_]*)\}\}$/);
    if (whole) {
      const key = whole[1];
      if (!(key in vars)) {
        throw new RenderConfigError(`未知のプレースホルダ: {{${key}}}`);
      }
      const whole_value = vars[key];
      if (typeof whole_value === "object" && whole_value !== null) {
        return deepClone(whole_value);
      }
      return String(whole_value);
    }
    return value.replace(PLACEHOLDER, (_m, key: string) => {
      if (!(key in vars)) {
        throw new RenderConfigError(`未知のプレースホルダ: {{${key}}}`);
      }
      const v = vars[key];
      if (typeof v === "object" && v !== null) {
        throw new RenderConfigError(
          `{{${key}}} は文字列の一部には差し込めません（値が ${Array.isArray(v) ? "配列" : "オブジェクト"} です）`,
        );
      }
      return String(v);
    });
  }
  if (Array.isArray(value)) return value.map((v) => substitute(v, vars));
  if (isObject(value)) {
    const out: JsonObject = {};
    for (const [k, v] of Object.entries(value)) out[k] = substitute(v, vars);
    return out;
  }
  return value;
}

function assertNoLeftoverPlaceholders(config: Json): void {
  const serialised = JSON.stringify(config);
  const found = serialised.match(PLACEHOLDER);
  if (found) {
    throw new RenderConfigError(
      `差し込まれていないプレースホルダが残っています: ${[...new Set(found)].join(", ")}`,
    );
  }
}

/**
 * 設定ファイルに秘密情報を直書きしていないか見る。OpenClaw は MCP の
 * `headers` などで `${ENV_VAR}` 参照を解決できるので、秘密は常にそちらに置く。
 * 出力先の `/data/openclaw.json` はボリューム上に残り続けるため、ここで止める
 * 価値がある。
 */
export function assertNoInlineSecrets(config: Json): void {
  const serialised = JSON.stringify(config);
  for (const { name, re } of SECRET_SHAPES) {
    const hit = serialised.match(re);
    if (hit) {
      throw new RenderConfigError(
        `設定に ${name} が直書きされている可能性があります。\${ENV_VAR} 参照に置き換えてください（該当箇所の先頭: ${hit[0].slice(0, 12)}…）`,
      );
    }
  }
}

function assertValidGuilds(guilds: GuildEntry[]): void {
  if (guilds.length === 0) {
    throw new RenderConfigError("guilds が空です。最低 1 ギルド必要です");
  }
  const seenLabel = new Set<string>();
  const seenGuild = new Set<string>();
  for (const g of guilds) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(g.label)) {
      throw new RenderConfigError(
        `label は kebab-case にしてください: ${JSON.stringify(g.label)}`,
      );
    }
    if (seenLabel.has(g.label)) {
      throw new RenderConfigError(`label が重複しています: ${g.label}`);
    }
    if (seenGuild.has(g.guildId)) {
      throw new RenderConfigError(`guildId が重複しています: ${g.guildId}`);
    }
    if (!/^\d+$/.test(g.guildId)) {
      throw new RenderConfigError(
        `guildId は snowflake（数字列）にしてください: ${JSON.stringify(g.guildId)}`,
      );
    }
    if (!Number.isInteger(g.chainId) || g.chainId <= 0) {
      throw new RenderConfigError(
        `chainId が不正です（${g.label}）: ${String(g.chainId)}`,
      );
    }
    if (!g.treeId) {
      throw new RenderConfigError(`treeId が空です（${g.label}）`);
    }
    if (!g.mcpUrl) {
      throw new RenderConfigError(`mcpUrl が空です（${g.label}）`);
    }
    // 空許可リスト = 全員に反応する、が既定になってしまうため明示的に弾く。
    if (!Array.isArray(g.allowUsers) || g.allowUsers.length === 0) {
      throw new RenderConfigError(
        `allowUsers が空です（${g.label}）。空にすると Bot が参加している全員に反応します`,
      );
    }
    seenLabel.add(g.label);
    seenGuild.add(g.guildId);
  }
}

/**
 * MCP サーバーの向き先が平文 HTTP になっていないか見る。ローカル開発だけ例外。
 */
function assertMcpUrls(servers: JsonObject): void {
  for (const [name, server] of Object.entries(servers)) {
    if (!isObject(server)) continue;
    const url = server.url;
    if (typeof url !== "string") continue;
    const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/.test(url);
    if (!url.startsWith("https://") && !local) {
      throw new RenderConfigError(
        `MCP サーバー ${name} の url が https ではありません: ${url}`,
      );
    }
  }
}

function ensurePath(root: JsonObject, path: string[]): JsonObject {
  let node = root;
  for (const key of path) {
    const next = node[key];
    if (next === undefined) {
      const created: JsonObject = {};
      node[key] = created;
      node = created;
    } else if (isObject(next)) {
      node = next;
    } else {
      throw new RenderConfigError(
        `テンプレートの ${path.join(".")} がオブジェクトではありません`,
      );
    }
  }
  return node;
}

/** 生成した agent 1 件分。指示書（AGENTS.md）の配置先を知るために使う。 */
export interface RenderedAgent {
  agentId: string;
  label: string;
  /** 展開後の `agents.entries[agentId].workspace`。未設定なら null。 */
  workspace: string | null;
}

export interface RenderResult {
  config: JsonObject;
  /** 生成した agent id（ギルド定義順）。 */
  agentIds: string[];
  /** 生成した agent の一覧。`push-config.sh` が AGENTS.md の配置に使う。 */
  agents: RenderedAgent[];
}

/**
 * テンプレートとギルド一覧から `openclaw.json` を組み立てる。
 */
export function renderConfig(
  template: JsonObject,
  guilds: GuildEntry[],
): RenderResult {
  assertValidGuilds(guilds);

  const toban = template.$toban;
  if (!isObject(toban) || !isObject(toban.perGuild)) {
    throw new RenderConfigError(
      "テンプレートに $toban.perGuild がありません（ギルドごとの雛形をここに置きます）",
    );
  }
  const perGuild = toban.perGuild as unknown as TobanTemplateBlock["perGuild"];
  for (const key of [
    "agent",
    "binding",
    "mcpServer",
    "discordGuild",
  ] as const) {
    if (!isObject(perGuild[key])) {
      throw new RenderConfigError(`$toban.perGuild.${key} がありません`);
    }
  }

  // $toban は雛形置き場なので出力には含めない。
  const { $toban: _template, ...rest } = deepClone(template);
  const config: JsonObject = rest;

  const agents = ensurePath(config, ["agents", "entries"]);
  const mcpServers = ensurePath(config, ["mcp", "servers"]);
  const discordGuilds = ensurePath(config, ["channels", "discord", "guilds"]);
  const discord = ensurePath(config, ["channels", "discord"]);

  // Interactions Endpoint URL は discord-bot Worker が持っているので、OpenClaw は
  // interaction を受け取れない。既定の "auto" のまま起動するとスラッシュコマンドを
  // 自動登録し、Worker の guild 単位 bulk PUT と相互に消し合う。
  const commands = ensurePath(discord, ["commands"]);
  if (commands.native === true) {
    throw new RenderConfigError(
      "channels.discord.commands.native は true にできません（Worker 側の登録コマンドを消し合います）",
    );
  }
  commands.native = false;

  // bindings はルート直下の配列（実機の `openclaw config schema` で確認済み。
  // 設定リファレンスの multiAgent.bindings という記述は誤り）。
  const existingBindings = config.bindings;
  if (existingBindings !== undefined && !Array.isArray(existingBindings)) {
    throw new RenderConfigError("テンプレートの bindings が配列ではありません");
  }
  const bindings: Json[] = existingBindings ? [...existingBindings] : [];

  const agentIds: string[] = [];
  const rendered: RenderedAgent[] = [];
  for (const guild of guilds) {
    const agentId = `toban-${guild.label}`;
    const mcpServerId = `toban-${guild.label}`;
    const vars: Record<string, Json> = {
      label: guild.label,
      guildId: guild.guildId,
      treeId: guild.treeId,
      chainId: guild.chainId,
      agentId,
      mcpServerId,
      mcpUrl: guild.mcpUrl,
      allowUsers: guild.allowUsers,
      channels: guild.channels ?? [],
    };

    if (agents[agentId] !== undefined) {
      throw new RenderConfigError(`agent id が衝突しています: ${agentId}`);
    }
    const agentEntry = substitute(perGuild.agent, vars);
    agents[agentId] = agentEntry;
    mcpServers[mcpServerId] = substitute(perGuild.mcpServer, vars);
    discordGuilds[guild.guildId] = substitute(perGuild.discordGuild, vars);
    bindings.push(substitute(perGuild.binding, vars));
    agentIds.push(agentId);

    const workspace =
      isObject(agentEntry) && typeof agentEntry.workspace === "string"
        ? agentEntry.workspace
        : null;
    rendered.push({ agentId, label: guild.label, workspace });
  }

  config.bindings = bindings;

  assertLeftovers(config);
  assertMcpUrls(mcpServers);

  return { config, agentIds, agents: rendered };
}

function assertLeftovers(config: JsonObject): void {
  assertNoLeftoverPlaceholders(config);
  assertNoInlineSecrets(config);
}
