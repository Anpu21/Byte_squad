import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { AccountType } from '@/modules/accounting-core/types/account-type.type';

/**
 * Chart-of-accounts node. System accounts are seeded (stable codes that
 * the posting paths reference); `isSystem=false` rows are user-created
 * and only journal vouchers may post to them.
 */
@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 8, unique: true })
  code!: string;

  @Column({ type: 'varchar', length: 80 })
  name!: string;

  @Column({ type: 'varchar', length: 16 })
  type!: AccountType;

  @Column({ type: 'boolean', name: 'is_system', default: true })
  isSystem!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
