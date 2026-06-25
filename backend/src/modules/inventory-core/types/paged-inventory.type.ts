import { Inventory } from '@/modules/inventory-core/entities/inventory.entity';

export interface PagedInventory {
  items: Inventory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
