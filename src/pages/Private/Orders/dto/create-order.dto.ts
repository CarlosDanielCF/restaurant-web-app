import { TypeOrder } from '../../../../models';

export interface CreateOrderDto {
  idempotencyKey?: string;
  clientId?: string;
  tableId?: string;
  details: CreateOrderDetailDto[];
  people: number;
  typeOrder: TypeOrder;
  notes?: string;
  // deliveryTime?: Date;
}

export interface CreateOrderDetailDto {
  productId: string;
  quantity: number;
  description?: string;
  price: number;
  productOptionId?: number;
}
