export interface Page<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface Stock {
  id: string;
  productId: string;
  optionId: number;
  productName: string;
  optionName: string | null;
  controlStock: boolean;
  quantity: string;
  version: number;
  hasMovements: boolean;
}
export interface SupplyProduct {
  id: string;
  name: string;
  kind: string;
  productionRouting: 'DIRECT' | 'PRODUCTION';
  stockControls: {
    id: string;
    optionId: number;
    controlStock: boolean;
    version: number;
  }[];
  options: { id: number; name: string }[];
}
export interface StockMovement {
  id: string;
  createdAt: string;
  type: string;
  quantityDelta: string;
  stockBefore: string;
  stockAfter: string;
  productName: string;
  optionName: string | null;
  actorName: string;
  reason: string | null;
  accountId?: string | null;
  purchaseId?: string | null;
}
export interface Expense {
  id: string;
  category: 'MARKET' | 'BEVERAGE';
  amount: string;
  currency: string;
  concept: string;
  operatingDate: string;
  createdAt: string;
  actorName: string;
  note?: string | null;
}
export interface Recoverable {
  lineId: string;
  accountId: string;
  accountVersion: number;
  productName: string;
  optionName: string | null;
  quantityRecoverable: string;
  accountLabel: string;
}
