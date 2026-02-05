import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';
import { Role as RoleEnum } from '@common/constants/roles.enum';

@Entity('roles')
export class Role {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ type: 'text', unique: true })
    name: RoleEnum;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    permissions: string; // JSON string of permissions

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
