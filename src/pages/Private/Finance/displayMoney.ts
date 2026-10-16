// Presentation only. The server remains authoritative for every financial operation.
export function cents(value: string): bigint | null {
  if (!/^-?\d{1,14}(\.\d{1,2})?$/.test(value)) return null;
  const negative = value.startsWith('-');
  const [whole, fraction = ''] = value.replace('-', '').split('.');
  return (
    (BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, '0'))) *
    BigInt(negative ? -1 : 1)
  );
}
export function displayCents(value: bigint): string {
  const negative = value < BigInt(0);
  const absolute = negative ? -value : value;
  return `${negative ? '-' : ''}${absolute / BigInt(100)}.${String(absolute % BigInt(100)).padStart(2, '0')}`;
}
export function difference(a: string, b: string): string {
  const left = cents(a),
    right = cents(b);
  return left === null || right === null ? '—' : displayCents(left - right);
}
export function sumMoney(values: string[]): string {
  return displayCents(
    values.reduce((sum, v) => sum + (cents(v) ?? BigInt(0)), BigInt(0))
  );
}
