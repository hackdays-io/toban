import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  type GuildEntry,
  type JsonObject,
  RenderConfigError,
  renderConfig,
} from "../src/render-config.js";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function baseTemplate(): JsonObject {
  return {
    $toban: {
      notes: ["テスト用"],
      perGuild: {
        agent: {
          name: "Toban ({{label}})",
          workspace: "/data/workspace/{{label}}",
        },
        binding: {
          type: "route",
          agentId: "{{agentId}}",
          match: { channel: "discord", guildId: "{{guildId}}" },
        },
        mcpServer: {
          url: "{{mcpUrl}}",
          headers: {
            Authorization: "Bearer ${TOBAN_MCP_TOKEN}",
            "x-toban-guild-id": "{{guildId}}",
            "x-toban-chain-id": "{{chainId}}",
          },
          codex: { agents: ["{{agentId}}"] },
        },
        discordGuild: { requireMention: true, users: "{{allowUsers}}" },
      },
    },
    channels: { discord: { commands: { native: false }, guilds: {} } },
    agents: { entries: {} },
    bindings: [],
    mcp: { servers: {} },
  };
}

function guild(over: Partial<GuildEntry> = {}): GuildEntry {
  return {
    label: "alpha",
    guildId: "111111111111111111",
    treeId: "1",
    chainId: 8453,
    mcpUrl: "https://bot.example.com/mcp",
    allowUsers: ["222222222222222222"],
    ...over,
  };
}

describe("renderConfig", () => {
  it("ギルドごとに agent / MCP サーバー / binding / 許可リストを生成する", () => {
    const { config, agentIds } = renderConfig(baseTemplate(), [
      guild(),
      guild({
        label: "beta",
        guildId: "333333333333333333",
        treeId: "7",
        chainId: 11155111,
        mcpUrl: "https://bot-staging.example.com/mcp",
        allowUsers: ["444444444444444444", "555555555555555555"],
      }),
    ]);

    expect(agentIds).toEqual(["toban-alpha", "toban-beta"]);

    const agents = (config.agents as JsonObject).entries as JsonObject;
    expect(Object.keys(agents)).toEqual(["toban-alpha", "toban-beta"]);
    expect((agents["toban-alpha"] as JsonObject).name).toBe("Toban (alpha)");

    const servers = (config.mcp as JsonObject).servers as JsonObject;
    const alphaServer = servers["toban-alpha"] as JsonObject;
    expect(alphaServer.url).toBe("https://bot.example.com/mcp");
    // MCP サーバーは agent に紐づける。ギルドを資格情報側に固定するための肝。
    expect((alphaServer.codex as JsonObject).agents).toEqual(["toban-alpha"]);
    expect((alphaServer.headers as JsonObject)["x-toban-chain-id"]).toBe(
      "8453",
    );

    // bindings はルート直下（実機の `openclaw config schema` で確認済み）
    expect(config.bindings).toEqual([
      {
        type: "route",
        agentId: "toban-alpha",
        match: { channel: "discord", guildId: "111111111111111111" },
      },
      {
        type: "route",
        agentId: "toban-beta",
        match: { channel: "discord", guildId: "333333333333333333" },
      },
    ]);
  });

  it("AGENTS.md の配置先が分かるよう agent マニフェストを返す", () => {
    const { agents } = renderConfig(baseTemplate(), [guild()]);
    expect(agents).toEqual([
      {
        agentId: "toban-alpha",
        label: "alpha",
        workspace: "/data/workspace/alpha",
      },
    ]);
  });

  it("$toban ブロックは出力に残さない", () => {
    const { config } = renderConfig(baseTemplate(), [guild()]);
    expect(config.$toban).toBeUndefined();
    expect(JSON.stringify(config)).not.toContain("perGuild");
  });

  it("配列のプレースホルダは型を保ったまま差し込まれる", () => {
    const { config } = renderConfig(baseTemplate(), [
      guild({ allowUsers: ["1", "2"] }),
    ]);
    const guilds = ((config.channels as JsonObject).discord as JsonObject)
      .guilds as JsonObject;
    expect((guilds["111111111111111111"] as JsonObject).users).toEqual([
      "1",
      "2",
    ]);
  });

  it("commands.native を false に固定する", () => {
    const template = baseTemplate();
    // テンプレートが未設定でも false になること
    ((template.channels as JsonObject).discord as JsonObject).commands =
      {} as JsonObject;
    const { config } = renderConfig(template, [guild()]);
    const discord = (config.channels as JsonObject).discord as JsonObject;
    expect((discord.commands as JsonObject).native).toBe(false);
  });

  it("commands.native = true のテンプレートは弾く", () => {
    const template = baseTemplate();
    ((template.channels as JsonObject).discord as JsonObject).commands = {
      native: true,
    };
    expect(() => renderConfig(template, [guild()])).toThrow(RenderConfigError);
    expect(() => renderConfig(template, [guild()])).toThrow(/native/);
  });

  it("allowUsers が空のギルドは弾く", () => {
    expect(() =>
      renderConfig(baseTemplate(), [guild({ allowUsers: [] })]),
    ).toThrow(/allowUsers/);
  });

  it("label と guildId の重複を弾く", () => {
    expect(() =>
      renderConfig(baseTemplate(), [guild(), guild({ guildId: "999" })]),
    ).toThrow(/label/);
    expect(() =>
      renderConfig(baseTemplate(), [guild(), guild({ label: "beta" })]),
    ).toThrow(/guildId/);
  });

  it("snowflake でない guildId を弾く", () => {
    expect(() =>
      renderConfig(baseTemplate(), [guild({ guildId: "abc" })]),
    ).toThrow(/snowflake/);
  });

  it("テンプレートの打ち間違い（未知のプレースホルダ）を弾く", () => {
    const template = baseTemplate();
    const perGuild = ((template.$toban as JsonObject).perGuild as JsonObject)
      .agent as JsonObject;
    perGuild.workspace = "/data/workspace/{{labell}}";
    expect(() => renderConfig(template, [guild()])).toThrow(/labell/);
  });

  it("秘密の直書きを弾く", () => {
    const template = baseTemplate();
    const server = ((template.$toban as JsonObject).perGuild as JsonObject)
      .mcpServer as JsonObject;
    (server.headers as JsonObject).Authorization =
      "Bearer 6yQKmVexampleTokenLiteral123";
    expect(() => renderConfig(template, [guild()])).toThrow(/直書き/);
  });

  it("${ENV_VAR} 参照は通す", () => {
    const { config } = renderConfig(baseTemplate(), [guild()]);
    const servers = (config.mcp as JsonObject).servers as JsonObject;
    const headers = (servers["toban-alpha"] as JsonObject)
      .headers as JsonObject;
    expect(headers.Authorization).toBe("Bearer ${TOBAN_MCP_TOKEN}");
  });

  it("平文 HTTP の MCP エンドポイントを弾く（localhost は許す）", () => {
    expect(() =>
      renderConfig(baseTemplate(), [
        guild({ mcpUrl: "http://bot.example.com/mcp" }),
      ]),
    ).toThrow(/https/);
    expect(() =>
      renderConfig(baseTemplate(), [
        guild({ mcpUrl: "http://localhost:8787/mcp" }),
      ]),
    ).not.toThrow();
  });

  it("ギルドが 0 件のときは弾く", () => {
    expect(() => renderConfig(baseTemplate(), [])).toThrow(/空/);
  });
});

describe("同梱のテンプレートと例", () => {
  it("config/openclaw.template.json + guilds.example.json がレンダリングできる", () => {
    const template = JSON.parse(
      readFileSync(resolve(pkgRoot, "config/openclaw.template.json"), "utf8"),
    ) as JsonObject;
    const guilds = JSON.parse(
      readFileSync(resolve(pkgRoot, "config/guilds.example.json"), "utf8"),
    ) as GuildEntry[];

    const { config, agentIds } = renderConfig(template, guilds);

    expect(agentIds.length).toBe(guilds.length);
    const discord = (config.channels as JsonObject).discord as JsonObject;
    expect((discord.commands as JsonObject).native).toBe(false);
    // 秘密が焼き込まれていないこと（レンダリング後も ${...} 参照のまま）
    expect(JSON.stringify(config)).toContain("${TOBAN_MCP_TOKEN}");
  });
});
