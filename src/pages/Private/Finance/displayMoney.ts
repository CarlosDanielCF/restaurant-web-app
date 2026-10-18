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

/** Exact presentation validation; never treats an overpayment as a valid negative balance. */
export function paymentDistribution(
  balance: string,
  parts: { amount: string; receivedAmount: string; method: string }[]
) {
  const due = cents(balance);
  const amounts = parts.map((p) => cents(p.amount));
  const total = amounts.reduce<bigint>(
    (sum, amount) => sum + (amount ?? BigInt(0)),
    BigInt(0)
  );
  const invalid =
    due === null ||
    due <= BigInt(0) ||
    !parts.length ||
    parts.some((p, i) => {
      const received = cents(p.receivedAmount),
        applied = amounts[i];
      return (
        applied === null ||
        applied <= BigInt(0) ||
        received === null ||
        received < applied ||
        (p.method !== 'CASH' && received !== applied)
      );
    });
  const exceeds = due !== null && total > due;
  return {
    valid: !invalid && !exceeds,
    exceeds,
    distributed: displayCents(total),
    remaining:
      due === null ? '—' : displayCents(total > due ? BigInt(0) : due - total)
  };
}
