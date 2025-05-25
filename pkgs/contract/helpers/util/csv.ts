import fs from "node:fs";

// CSV row type with string fields to preserve large uint256 values
type CSVRow = { hatId: string; wearer: string; time: string };

/**
 * CSVからデータを読み込む関数
 * @param filePath - 読み込むCSVファイルのパス
 * @returns 読み込んだデータの配列
 */
export function readCsv(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content
    .trim()
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("//"));
  if (lines.length < 2) return [];

  // Skip header row and strip quotes from values
  return lines.slice(1).map((line) => {
    const [hatId, wearer, time] = line
      .split(",")
      .map((v) => v.trim().replace(/^"+|"+$/g, ""));
    return { hatId, wearer, time };
  });
}

/**
 * CSVRow配列をbatchMintHatの引数形式に整形する
 * @param rows - readCsvで読み込んだデータ
 * @returns [hatIds, wearers, times]
 */
export function formatBatchMintArgs(
  rows: CSVRow[],
): [bigint[], `0x${string}`[], bigint[]] {
  const hatIds = rows.map((r) => BigInt(r.hatId));
  const wearers: `0x${string}`[] = rows.map((r) => r.wearer as `0x${string}`);
  const times = rows.map((r) => BigInt(r.time));
  return [hatIds, wearers, times];
}
