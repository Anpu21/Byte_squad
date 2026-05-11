import { Inventory } from '@inventory/entities/inventory.entity';

export interface PagedInventory {
  items: Inventory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
