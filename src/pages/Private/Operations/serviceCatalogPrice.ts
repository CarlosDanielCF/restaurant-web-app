type PriceOption = { price: number; isActive: boolean };

export function serviceCatalogPrice(
  basePrice: number,
  options: PriceOption[]
): string {
  const active = options.filter((option) => option.isActive);
  if (active.length === 1) return `S/ ${active[0].price}`;
  if (active.length > 1) {
    const valid = active
      .map((option) => Number(option.price))
      .filter((price) => Number.isFinite(price) && price > 0);
    if (valid.length) return `Desde S/ ${Math.min(...valid)}`;
  }
  return `S/ ${basePrice}`;
}
