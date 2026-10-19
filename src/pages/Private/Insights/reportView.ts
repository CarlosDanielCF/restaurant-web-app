/** Presentation helpers only: totals are supplied by the report service. */
export type ReportPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';
export interface DateRange {
  from: string;
  to: string;
}
export const periodLabels: Record<ReportPeriod, string> = {
  today: 'Hoy',
  yesterday: 'Ayer',
  week: 'Esta semana',
  month: 'Este mes',
  custom: 'Personalizado'
};
export function restaurantDate(timeZone: string, now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function periodRange(
  period: Exclude<ReportPeriod, 'custom'>,
  timeZone: string,
  now = new Date()
): DateRange {
  const today = restaurantDate(timeZone, now),
    day = new Date(`${today}T12:00:00Z`);
  if (period === 'yesterday') day.setUTCDate(day.getUTCDate() - 1);
  if (period === 'week')
    day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  if (period === 'month') day.setUTCDate(1);
  const from = day.toISOString().slice(0, 10);
  return { from, to: period === 'yesterday' ? from : today };
}
export function validReportRange(range: DateRange): boolean {
  if (![range.from, range.to].every((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))
    return false;
  const start = new Date(`${range.from}T12:00:00Z`),
    end = new Date(`${range.to}T12:00:00Z`);
  return (
    Number.isFinite(start.getTime()) &&
    Number.isFinite(end.getTime()) &&
    start.toISOString().slice(0, 10) === range.from &&
    end.toISOString().slice(0, 10) === range.to &&
    end >= start &&
    (end.getTime() - start.getTime()) / 86400000 < 366
  );
}
/** No recomputation or floating point rounding of authoritative decimal totals. */
export function reportAmount(value: unknown, currency = 'PEN'): string {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(String(value));
  if (!match) return '—';
  const integer = match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimal = (match[3] || '').padEnd(2, '0');
  return `${currency === 'PEN' ? 'S/' : currency} ${match[1]}${integer}.${decimal}`;
}
/** The shared interceptor rejects an Axios response directly, while network errors keep their original shape. */
export function reportError(error: unknown, fallback: string): string {
  const response = error as {
    data?: { message?: unknown };
    response?: { data?: { message?: unknown } };
  } | null;
  const message = response?.data?.message ?? response?.response?.data?.message;
  return Array.isArray(message)
    ? message.map(String).join(' · ')
    : typeof message === 'string'
      ? message
      : fallback;
}
export const reportGroups = [
  { label: 'Ventas y cuentas', kinds: ['sales', 'accounts', 'reservations'] },
  {
    label: 'Productos',
    kinds: [
      'products',
      'product-activity',
      'top-products',
      'least-products',
      'portions',
      'special-prices'
    ]
  },
  {
    label: 'Cocina',
    kinds: ['dispatches', 'slow', 'takeaway', 'delivery-corrections']
  },
  {
    label: 'Incidencias',
    kinds: [
      'cancellations',
      'substitutions',
      'returns',
      'discounts',
      'courtesies'
    ]
  },
  {
    label: 'Dinero',
    kinds: ['collections', 'refunds', 'debts', 'installments']
  },
  {
    label: 'Personal',
    kinds: ['waiter-results', 'settlements', 'tips', 'staff']
  },
  { label: 'Bebidas y egresos', kinds: ['expenses', 'stock-movements'] },
  { label: 'Delivery', kinds: ['delivery', 'custody'] },
  { label: 'Auditoría', kinds: ['audit'] }
];
export const reportNames: Record<string, string> = {
  expenses: 'Compras y egresos',
  'stock-movements': 'Kardex de bebidas',
  sales: 'Ventas confirmadas',
  accounts: 'Cuentas y mesas',
  reservations: 'Reservas',
  collections: 'Cobranzas y métodos',
  settlements: 'Rendiciones',
  products: 'Productos vendidos',
  'product-activity': 'Detalle de productos',
  'top-products': 'Más vendidos',
  'least-products': 'Menos vendidos',
  dispatches: 'Comandas y entregas',
  slow: 'Comandas >15 minutos',
  discounts: 'Descuentos',
  portions: 'Porciones especiales',
  'special-prices': 'Precios especiales',
  cancellations: 'Cancelaciones',
  substitutions: 'Sustituciones',
  refunds: 'Reembolsos',
  returns: 'Devoluciones de consumo',
  'delivery-corrections': 'Correcciones de entrega',
  takeaway: 'Unidades para llevar',
  courtesies: 'Cortesías',
  tips: 'Propinas',
  staff: 'Consumo de personal',
  debts: 'Deudas',
  installments: 'Abonos',
  audit: 'Historial operativo',
  delivery: 'Delivery / recogidas',
  custody: 'Efectivo courier',
  'waiter-results': 'Cobranzas por trabajador'
};
export function reportLink(
  kind: string,
  range: DateRange,
  extra: Record<string, string> = {}
): string {
  return `/operational-reports?${new URLSearchParams({ kind, ...range, ...extra }).toString()}`;
}
