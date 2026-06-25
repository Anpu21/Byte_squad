import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Year-sequential counter for journal voucher numbers (`JV-YYYY-NNNNNN`). */
@Entity('journal_counters')
export class JournalCounter {
  @PrimaryColumn({ type: 'integer' })
  year!: number;

  @Column({ type: 'integer', name: 'last_seq', default: 0 })
  lastSeq!: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
