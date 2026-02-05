import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { Company } from '@modules/companies/entities/company.entity';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    email: string;

    @Column()
    @Exclude()
    password: string;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column({ nullable: true })
    phone: string;

    @Column()
    roleId: string;

    @ManyToOne(() => Role, { eager: true })
    @JoinColumn({ name: 'roleId' })
    role: Role;

    @Column()
    companyId: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'companyId' })
    company: Company;

    @Column({ nullable: true })
    branchId: string;

    @Column({ default: true })
    isActive: boolean;

    @Column({ nullable: true })
    lastLoginAt: Date;

    @Column({ nullable: true })
    @Exclude()
    refreshToken: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Virtual property
    get fullName(): string {
        return `${this.firstName} ${this.lastName}`;
    }
}
