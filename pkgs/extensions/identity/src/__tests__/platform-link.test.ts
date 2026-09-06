/**
 * `platform_links.metadata` の読み書き（#575 前半）。
 *
 * ネットワークもチェーンも触らない。DB は in-memory SQLite。
 */
import { describe, expect, it } from "vitest";
import {
  handlePlatformLink,
  handlePlatformLinkNotifyChannel,
} from "../handlers/platform-link.js";
import {
  getNotifyChannelId,
  mergePlatformLinkMetadata,
  parsePlatformLinkMetadata,
  serializePlatformLinkMetadata,
} from "../platform-link-metadata.js";
import { getPlatformLink, upsertPlatformLink } from "../queries.js";
import { makeTestDb } from "./fixtures.js";

const WRITE_SECRET = "test-platform-link-secret-1234";
const GUILD = "123456789012345678";
const CHANNEL = "987654321098765432";
const OTHER_CHANNEL = "111111111111111111";
const WALLET = "0x1111111111111111111111111111111111111111";

type Db = ReturnType<typeof makeTestDb>["db"];

async function seedLink(db: Db, metadata: string | null = null) {
  await upsertPlatformLink(db, {
    provider: "discord",
    platformId: GUILD,
    treeId: "42",
    installedBy: WALLET,
    metadata,
    createdAt: 1_700_000_000,
  });
}

function getReq(platformId = GUILD): Request {
  return new Request(
    `https://example.test/api/platform-link?provider=discord&platform_id=${platformId}`,
  );
}

function notifyReq(body: unknown, secret = WRITE_SECRET): Request {
  return new Request("https://example.test/api/platform-link/notify-channel", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-toban-platform-link-secret": secret,
    },
    body: JSON.stringify(body),
  });
}

async function setNotifyChannel(
  db: Db,
  channelId: string | null,
): Promise<Response> {
  return handlePlatformLinkNotifyChannel(
    notifyReq({ provider: "discord", platformId: GUILD, channelId }),
    { db, writeSecret: WRITE_SECRET },
  );
}

describe("platform-link metadata helpers", () => {
  it("部分更新で他の名前空間を消さない", () => {
    // #577 が入れる想定の値が先にあるとする
    const existing = JSON.stringify({ v: 1, mcp: { tokenVersion: 3 } });
    const next = mergePlatformLinkMetadata(
      parsePlatformLinkMetadata(existing),
      { v: 1, notify: { channelId: CHANNEL } },
    );
    expect(next).toEqual({
      v: 1,
      mcp: { tokenVersion: 3 },
      notify: { channelId: CHANNEL },
    });
  });

  it("同じ名前空間の中でも既存キーを残す", () => {
    const existing = JSON.stringify({
      v: 1,
      notify: { channelId: OTHER_CHANNEL, locale: "ja" },
    });
    const next = mergePlatformLinkMetadata(
      parsePlatformLinkMetadata(existing),
      { v: 1, notify: { channelId: CHANNEL } },
    );
    expect(next.notify).toEqual({ channelId: CHANNEL, locale: "ja" });
  });

  it("壊れた JSON は空オブジェクトとして扱う（throw しない）", () => {
    expect(parsePlatformLinkMetadata("not json")).toEqual({});
    expect(parsePlatformLinkMetadata("[1,2]")).toEqual({});
    expect(parsePlatformLinkMetadata(null)).toEqual({});
    expect(getNotifyChannelId("not json")).toBeNull();
  });

  it("中身が空になったら NULL に落とす", () => {
    expect(serializePlatformLinkMetadata({ v: 1 })).toBeNull();
    expect(serializePlatformLinkMetadata({ v: 1, notify: {} })).toBeNull();
  });

  it("不正な値が DB に入っていても読み出しは null", () => {
    expect(
      getNotifyChannelId(JSON.stringify({ notify: { channelId: 42 } })),
    ).toBeNull();
    expect(
      getNotifyChannelId(JSON.stringify({ notify: { channelId: "abc" } })),
    ).toBeNull();
  });
});

describe("GET /api/platform-link", () => {
  it("未設定なら notifyChannelId は null", async () => {
    const { db } = makeTestDb();
    await seedLink(db);
    const res = await handlePlatformLink(getReq(), { db });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { notifyChannelId: string | null };
    expect(body.notifyChannelId).toBeNull();
  });

  it("metadata に入っていれば notifyChannelId を返す", async () => {
    const { db } = makeTestDb();
    await seedLink(
      db,
      JSON.stringify({ v: 1, notify: { channelId: CHANNEL } }),
    );
    const res = await handlePlatformLink(getReq(), { db });
    const body = (await res.json()) as {
      notifyChannelId: string | null;
      metadata?: unknown;
    };
    expect(body.notifyChannelId).toBe(CHANNEL);
    // 生の metadata も従来どおり返る
    expect(body.metadata).toEqual({ v: 1, notify: { channelId: CHANNEL } });
  });

  it("platform link が無ければ 404", async () => {
    const { db } = makeTestDb();
    const res = await handlePlatformLink(getReq("999999999999999999"), { db });
    expect(res.status).toBe(404);
  });
});

describe("POST /api/platform-link/notify-channel", () => {
  it("設定して読み出せる", async () => {
    const { db } = makeTestDb();
    await seedLink(db);

    const res = await setNotifyChannel(db, CHANNEL);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, notifyChannelId: CHANNEL });

    const read = await handlePlatformLink(getReq(), { db });
    expect(
      ((await read.json()) as { notifyChannelId: string }).notifyChannelId,
    ).toBe(CHANNEL);
  });

  it("上書きできる", async () => {
    const { db } = makeTestDb();
    await seedLink(db);
    await setNotifyChannel(db, CHANNEL);
    await setNotifyChannel(db, OTHER_CHANNEL);
    const row = await getPlatformLink(db, "discord", GUILD);
    expect(getNotifyChannelId(row?.metadata)).toBe(OTHER_CHANNEL);
  });

  it("null で解除でき、他に何も無ければ metadata は NULL に戻る", async () => {
    const { db } = makeTestDb();
    await seedLink(db);
    await setNotifyChannel(db, CHANNEL);

    const res = await setNotifyChannel(db, null);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, notifyChannelId: null });

    const row = await getPlatformLink(db, "discord", GUILD);
    expect(row?.metadata).toBeNull();
  });

  it("**他の名前空間のキーを部分更新で消さない**（#577 の値が生き残る）", async () => {
    const { db } = makeTestDb();
    await seedLink(db, JSON.stringify({ v: 1, mcp: { tokenVersion: 3 } }));

    await setNotifyChannel(db, CHANNEL);
    let row = await getPlatformLink(db, "discord", GUILD);
    expect(JSON.parse(row?.metadata ?? "{}")).toEqual({
      v: 1,
      mcp: { tokenVersion: 3 },
      notify: { channelId: CHANNEL },
    });

    // 解除しても mcp は残る（metadata ごと NULL にしない）
    await setNotifyChannel(db, null);
    row = await getPlatformLink(db, "discord", GUILD);
    expect(JSON.parse(row?.metadata ?? "{}")).toEqual({
      v: 1,
      mcp: { tokenVersion: 3 },
    });
  });

  it.each([
    ["数字以外", "not-a-snowflake"],
    ["メンション記法", "<#123456789012345678>"],
    ["空文字", ""],
    ["短すぎる", "12345"],
    ["先頭ゼロ", "0123456789012345678"],
    ["小数を含む", "12345678901234567.8"],
  ])("不正なチャンネル ID を弾く: %s", async (_label, channelId) => {
    const { db } = makeTestDb();
    await seedLink(db);
    const res = await setNotifyChannel(db, channelId);
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({
      error: "invalid_channel_id",
    });
    const row = await getPlatformLink(db, "discord", GUILD);
    expect(row?.metadata).toBeNull();
  });

  it("文字列でも null でもない型を弾く", async () => {
    const { db } = makeTestDb();
    await seedLink(db);
    const res = await handlePlatformLinkNotifyChannel(
      notifyReq({ provider: "discord", platformId: GUILD, channelId: 123 }),
      { db, writeSecret: WRITE_SECRET },
    );
    expect(res.status).toBe(400);
  });

  it("channelId 未指定は 400（解除は明示的に null を送らせる）", async () => {
    const { db } = makeTestDb();
    await seedLink(db);
    const res = await handlePlatformLinkNotifyChannel(
      notifyReq({ provider: "discord", platformId: GUILD }),
      { db, writeSecret: WRITE_SECRET },
    );
    expect(res.status).toBe(400);
    expect((await res.json()) as { error: string }).toMatchObject({
      error: "invalid_body",
    });
  });

  it("platform link が無いギルドには設定できない（404）", async () => {
    const { db } = makeTestDb();
    const res = await setNotifyChannel(db, CHANNEL);
    expect(res.status).toBe(404);
  });

  it("秘密が違えば 401、行は変わらない", async () => {
    const { db } = makeTestDb();
    await seedLink(db);
    const res = await handlePlatformLinkNotifyChannel(
      notifyReq(
        { provider: "discord", platformId: GUILD, channelId: CHANNEL },
        "wrong-secret",
      ),
      { db, writeSecret: WRITE_SECRET },
    );
    expect(res.status).toBe(401);
    const row = await getPlatformLink(db, "discord", GUILD);
    expect(row?.metadata).toBeNull();
  });

  it("writeSecret 未設定なら書き込み口は閉じている", async () => {
    const { db } = makeTestDb();
    await seedLink(db);
    const res = await handlePlatformLinkNotifyChannel(
      notifyReq({ provider: "discord", platformId: GUILD, channelId: CHANNEL }),
      { db },
    );
    expect(res.status).toBe(401);
  });

  it("GET は 405", async () => {
    const { db } = makeTestDb();
    const res = await handlePlatformLinkNotifyChannel(
      new Request("https://example.test/api/platform-link/notify-channel"),
      { db, writeSecret: WRITE_SECRET },
    );
    expect(res.status).toBe(405);
  });
});

describe("POST /api/platform-link（既存の upsert 経路）", () => {
  function upsertReq(body: Record<string, unknown>): Request {
    return new Request("https://example.test/api/platform-link", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-toban-platform-link-secret": WRITE_SECRET,
      },
      body: JSON.stringify(body),
    });
  }

  it("metadata を送らない再インストールで通知設定が消えない", async () => {
    const { db } = makeTestDb();
    await seedLink(db);
    await setNotifyChannel(db, CHANNEL);

    // Bot の install コールバックは metadata を送らない
    const res = await handlePlatformLink(
      upsertReq({
        provider: "discord",
        platformId: GUILD,
        treeId: "43",
        installedBy: WALLET,
      }),
      { db, writeSecret: WRITE_SECRET },
    );
    expect(res.status).toBe(200);

    const row = await getPlatformLink(db, "discord", GUILD);
    expect(row?.treeId).toBe("43");
    expect(getNotifyChannelId(row?.metadata)).toBe(CHANNEL);
  });

  it("metadata: null は明示的な全消去", async () => {
    const { db } = makeTestDb();
    await seedLink(db);
    await setNotifyChannel(db, CHANNEL);
    await handlePlatformLink(
      upsertReq({
        provider: "discord",
        platformId: GUILD,
        treeId: "42",
        installedBy: WALLET,
        metadata: null,
      }),
      { db, writeSecret: WRITE_SECRET },
    );
    const row = await getPlatformLink(db, "discord", GUILD);
    expect(row?.metadata).toBeNull();
  });
});
