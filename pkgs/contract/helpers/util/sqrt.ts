export function sqrt(y: bigint): bigint {
  if (y > 3n) {
    let z: bigint = y;
    let x: bigint = y / 2n + 1n;
    while (x < z) {
      z = x;
      x = (y / x + x) / 2n;
    }
    return z;
  }
  if (y !== 0n) {
    return 1n;
  }
  return 0n;
}
