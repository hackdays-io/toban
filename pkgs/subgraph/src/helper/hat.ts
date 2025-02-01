export function hatIdToTreeId(hatId: string): string {
  const id = Number.parseInt(
    `0x${hatId.slice(2).padStart(64, "0").substring(0, 8)}`,
  )
    .toString()
    .split(".")[0];
  return id;
}
