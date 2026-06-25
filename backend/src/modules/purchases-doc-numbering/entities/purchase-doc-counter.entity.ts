import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import type { PurchaseDocType } from '@/modules/purchases-doc-numbering/types/purchase-doc-type.type';

/**
 * Year-scoped sequence per purchase document family (GRN/PO/SPAY/PRET).
 * Allocated under a pessimistic write lock inside the caller's transaction —
 * same race-safety contract as `InvoiceCounter`.
 */
@Entity('purchase_doc_counters')
export class PurchaseDocCounter {
  @PrimaryColumn({ type: 'varchar', length: 8, name: 'doc_type' })
  docType!: PurchaseDocType;

  @PrimaryColumn({ type: 'integer' })
  year!: number;

  @Column({ type: 'integer', name: 'last_seq', default: 0 })
  lastSeq!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
