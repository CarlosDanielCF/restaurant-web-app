export interface CreateProductOptionDto {
  productionRouting?: 'PRODUCTION' | 'DIRECT' | null;
  name: string;
  price?: number;
  cost?: number;
  trackStock?: boolean;
  quantity?: number;
  productId: string;
  isDefault?: boolean;
}
