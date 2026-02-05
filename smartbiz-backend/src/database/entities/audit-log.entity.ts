import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @Column()
    action: string;

    @Column()
    entity: string;

    @Column({ nullable: true })
    entityId: string;

    @Column({ type: 'text', nullable: true })
    oldValues: string;

    @Column({ type: 'text', nullable: true })
    newValues: string;

    @Column({ nullable: true })
    ipAddress: string;

    @CreateDateColumn()
    createdAt: Date;
}
