import { cents, displayCents } from '../Finance/displayMoney';
/** Only a preview. Quantity, price, total and stock are revalidated by the server. */
export function purchasePreview(
  quantity: string,
  unitCost: string
): string | null {
  if (!/^\d{1,9}$/.test(quantity) || BigInt(quantity) <= BigInt(0)) return null;
  const cost = cents(unitCost);
  if (cost === null || cost < BigInt(0)) return null;
  return displayCents(BigInt(quantity) * cost);
}
export function wholeUnits(value: string, allowZero = false): boolean {
  return /^\d{1,9}$/.test(value) && (allowZero || BigInt(value) > BigInt(0));
}
