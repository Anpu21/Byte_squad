import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

/**
 * Per-year invoice sequence row. One row per year. Read/incremented under a
 * pessimistic write lock during checkout so concurrent sales never collide on
 * the same INV-YYYY-NNNNNN.
 */
@Entity('invoice_counters')
export class InvoiceCounter {
  @PrimaryColumn({ type: 'integer' })
  year!: number;

  @Column({ type: 'integer', name: 'last_seq', default: 0 })
  lastSeq!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
