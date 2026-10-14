import { ProductStatus } from '../../../../models';

/**
 * Data transfer object (DTO) with expected fields for creating a new product.
 * @author Santiago Quirumbay
 * @version 1.1 16/12/2023 Adds productionAreaId field.
 * @version 1.2 17/12/2023 Adds costUnit and quantity fields.
 */
export interface CreateProductDto {
  expectedVersion?:number;
  kind?:'FOOD'|'DRINK';
  trackStock?:boolean;
  hasVariants?:boolean;
  defaultVariantIndex?:number;
  productOptions?:{name:string;price:number;cost?:number;trackStock?:boolean;defaultStock?:number;isDefault?:boolean}[];
  name: string;
  price: number;
  categoryId: string;
  description?: string;
  status?: ProductStatus;
  productionAreaId?: number;
  unitCost?: number;
  quantity?: number;
}
