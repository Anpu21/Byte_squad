import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Branch } from './branch.entity';

@Entity('companies')
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column({ nullable: true })
    legalName: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    city: string;

    @Column({ nullable: true })
    state: string;

    @Column({ nullable: true })
    country: string;

    @Column({ nullable: true })
    pincode: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    website: string;

    @Column({ default: 'INR' })
    currency: string;

    @Column({ type: 'date', nullable: true })
    financialYearStart: Date;

    @Column({ type: 'date', nullable: true })
    financialYearEnd: Date;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Branch, (branch) => branch.company)
    branches: Branch[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
