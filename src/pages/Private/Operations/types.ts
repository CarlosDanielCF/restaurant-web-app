export interface Modifier {
  id: string;
  name: string;
  kind: 'ACCOMPANIMENT' | 'EXTRA';
  price: number;
  isAvailable: boolean;
}
export interface Configuration {
  modifiers: Modifier[];
  combo: { productId: string; quantity: number }[];
  courtesy: boolean;
}
export interface Product {
  images?: string | null;
  category?: { id: string; name: string };
  id: string;
  name: string;
  price: number;
  kind: 'FOOD' | 'DRINK';
  productionRouting: 'PRODUCTION' | 'DIRECT';
  status: string;
  quantity: number;
  trackStock: boolean;
  version: number;
  isActive: boolean;
  configuration: Configuration | null;
  options: {
    id: number;
    name: string;
    price: number;
    isAvailable: boolean;
    isActive: boolean;
    version: number;
    quantity: number;
    manageStock: boolean;
    isDefault?: boolean;
    productionRouting?: 'PRODUCTION' | 'DIRECT' | null;
  }[];
}
export interface Component {
  id: string;
  name: string;
  options: {
    id: string;
    productId: string;
    isAvailable: boolean;
    portions: number | null;
  }[];
}
export interface DailyMenu {
  id: string;
  name: string;
  price: number;
  serviceDate: string | null;
  isAvailable: boolean;
  components: Component[];
  version: number;
}
export interface Portion {
  id: string;
  name: string;
  availabilityUnits: number;
  isActive: boolean;
  version: number;
}
export interface Table {
  id: string;
  name: string;
  isActive: boolean;
  isAvailable: boolean;
}
export interface Operator {
  id: string;
  firstName: string;
  lastName: string;
}
export interface Line {
  sourceType: 'PRODUCT' | 'DAILY_MENU';
  sourceId: string;
  hasDeliveredUnits?: boolean;
  changeableQuantity?: string;
  takeawayQuantity?: string;
  kind?: string;
  beneficiaryUserId?: string;
  originalUnitPrice?: string;
  confirmedQuantity: string;
  restoredQuantity: string;
  id: string;
  quantity: string;
  appliedUnitPrice: string;
  subtotal: string;
  notes: string;
  status: string;
  productSnapshot: {
    name: string;
    stockRequirements: unknown[];
    option?: { id: number };
    modifiers?: { id: string; price: number }[];
    components?: { componentId: string; optionId: string }[];
    portionPolicyId?: string;
    priceReason?: string;
  };
}
export interface Account {
  hasConfirmedConsumption?: boolean;
  createdAt?: string;
  grossTotal?: string;
  discountTotal?: string;
  notes?: string;
  id: string;
  modality: 'TABLE' | 'TAKE_AWAY' | 'OWN_DELIVERY' | 'EXTERNAL_COURIER';
  responsibleUserId: string;
  clientId: string | null;
  attentionStatus: string;
  paymentStatus: string;
  version: number;
  total: string;
  balance: string;
  tables: Table[];
  lines: Line[];
  history: {
    action: string;
    actorId: string;
    createdAt: string;
    afterData: unknown;
  }[];
}
export interface Reservation {
  id: string;
  name: string;
  phone: string;
  scheduledAt: string;
  people: number;
  notes: string;
  status: string;
  version: number;
  accountId: string | null;
}
