export interface KitchenSnapshot {
  consumptionKind?: string;
  beneficiaryUserId?: string;
  quantity?: number | string;
  name: string;
  notes: string;
  portionKind?: string;
  availabilityUnitsPerItem?: string;
  option?: { name: string };
  modifiers?: { name: string }[];
  components?: { name: string; quantity?: number }[];
}
export interface DispatchItem {
  id: string;
  consumptionLineId: string;
  quantity: string;
  delivered: string;
  pending: number;
  status: string;
  itemSnapshot: KitchenSnapshot;
}
export interface ExitEvent {
  id: string;
  dispatchItemId: string;
  quantityDelta: string;
  correctsEventId: string | null;
  createdAt: string;
  actorId: string;
  reason: string;
}
export interface Dispatch {
  id: string;
  accountId: string;
  sequenceNumber: number;
  confirmedAt: string;
  accountVersion: number;
  modality: string;
  firstName: string;
  lastName: string;
  tables: { name: string }[];
  items: DispatchItem[];
  events: ExitEvent[];
  pending: boolean;
}
export interface Notice {
  location: string;
  id: string;
  dispatchId: string;
  kind: string;
  reason: string;
  beforeData: KitchenSnapshot;
  afterData: KitchenSnapshot;
  createdAt: string;
}
export interface Board {
  serverNow: string;
  totalPending: number;
  dispatches: Dispatch[];
  notices: Notice[];
  presence: { screens: number };
}
