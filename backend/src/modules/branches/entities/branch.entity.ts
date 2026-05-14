import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@users/entities/user.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Transaction } from '@pos/entities/transaction.entity';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 16, unique: true })
  code!: string;

  @Column({ type: 'varchar', unique: true })
  name!: string;

  @Column({ type: 'varchar', name: 'address_line_1' })
  addressLine1!: string;

  @Column({ type: 'varchar', name: 'address_line_2', nullable: true })
  addressLine2!: string | null;

  @Column({ type: 'varchar', nullable: true })
  city!: string | null;

  @Column({ type: 'varchar', nullable: true })
  state!: string | null;

  @Column({ type: 'varchar', nullable: true })
  country!: string | null;

  @Column({ type: 'varchar', name: 'postal_code', nullable: true })
  postalCode!: string | null;

  @Column({ type: 'varchar', length: 16 })
  phone!: string;

  @Column({ type: 'varchar', nullable: true })
  email!: string | null;

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean;

  @OneToMany(() => User, (user) => user.branch)
  users!: User[];

  @OneToMany(() => Inventory, (inventory) => inventory.branch)
  inventoryItems!: Inventory[];

  @OneToMany(() => Transaction, (transaction) => transaction.branch)
  transactions!: Transaction[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
