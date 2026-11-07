export interface CommandRow {
  accountId: string;
  createdAt: string;
  attentionStatus: string;
  modality: string;
  currency: string;
  responsibleUserId: string;
  waiter: string;
  tables: string;
  orders: number;
  commandNumber: number;
  total: string;
  paid: string;
  balance: string;
  paymentStatus: string;
}
export interface CommandResult {
  rows: CommandRow[];
  total: number;
  page: number;
  limit: number;
  timeZone: string;
  capturedAt: string;
}
export interface CommandDetail {
  account: CommandRow;
  products: {
    id: string;
    product: string;
    quantity: string;
    appliedUnitPrice: string;
    originalUnitPrice: string;
    status: string;
    kind: string;
    notes?: string;
    createdAt: string;
    confirmedAt?: string;
    discount: string;
  }[];
  payments: {
    id: string;
    method: string;
    appliedAmount: string;
    receivedAmount: string;
    changeAmount: string;
    confirmedAt: string;
    refunded: string;
  }[];
  dispatches: {
    id: string;
    commandNumber: number;
    confirmedAt: string;
    sendStatus: string;
    items: number;
  }[];
  accountDiscount: string;
  timeZone: string;
}
export const commandType = (modality: string) =>
  modality === 'TABLE'
    ? 'Mesa'
    : modality === 'TAKE_AWAY'
      ? 'Para llevar'
      : 'Delivery';
export const commandStatus = (status: string) =>
  ({ OPEN: 'Abierta', CLOSED: 'Cerrada' })[status] || status;
export const paymentStatus = (status: string) =>
  ({ SETTLED: 'Pagado', PARTIAL: 'Parcial', UNPAID: 'Pendiente' })[status] ||
  status;
export const commandTotals = (rows: CommandRow[]) =>
  rows.reduce(
    (a, r) => ({
      total: a.total + Number(r.total),
      paid: a.paid + Number(r.paid),
      balance: a.balance + Number(r.balance)
    }),
    { total: 0, paid: 0, balance: 0 }
  );
