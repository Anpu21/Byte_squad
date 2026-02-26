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

    @Column({ type: 'varchar', unique: true })
    name!: string;

    @Column({ type: 'varchar' })
    address!: string;

    @Column({ type: 'varchar' })
    phone!: string;

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
