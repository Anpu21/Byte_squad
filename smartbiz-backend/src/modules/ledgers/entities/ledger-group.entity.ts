import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { LedgerGroupType } from '@common/constants/accounting.enum';

@Entity('ledger_groups')
export class LedgerGroup {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ type: 'text' })
    type: LedgerGroupType;

    @Column()
    companyId: string;

    @Column({ nullable: true })
    parentId: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: false })
    isSystem: boolean; // System groups cannot be deleted

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
