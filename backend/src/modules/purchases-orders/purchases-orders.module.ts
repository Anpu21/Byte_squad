import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SuppliersModule } from '@/modules/suppliers/suppliers.module';
import { PurchasesDocNumberingModule } from '@/modules/purchases-doc-numbering/purchases-doc-numbering.module';
import { PurchasesGrnModule } from '@/modules/purchases-grn/purchases-grn.module';
import { PurchaseOrder } from '@/modules/purchases-orders/entities/purchase-order.entity';
import { PurchaseOrderItem } from '@/modules/purchases-orders/entities/purchase-order-item.entity';
import { PurchaseOrdersRepository } from '@/modules/purchases-orders/purchase-orders.repository';
import { PurchaseOrdersService } from '@/modules/purchases-orders/purchase-orders.service';
import { PurchaseOrdersController } from '@/modules/purchases-orders/purchase-orders.controller';

/**
 * Purchase-order module — the Draft → Sent → Received/Cancelled procurement
 * intent that GRNs convert against. Pairs with PurchasesGrnModule via
 * forwardRef (each receives the other's repository).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseOrder, PurchaseOrderItem]),
    PurchasesDocNumberingModule,
    SuppliersModule,
    forwardRef(() => PurchasesGrnModule),
  ],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersRepository, PurchaseOrdersService],
  exports: [PurchaseOrdersRepository, PurchaseOrdersService],
})
export class PurchasesOrdersModule {}
