import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

export enum BackupStatus {
    SUCCESS = 'SUCCESS',
    FAILED = 'FAILED',
    IN_PROGRESS = 'IN_PROGRESS',
}

export enum BackupType {
    MANUAL = 'MANUAL',
    SCHEDULED = 'SCHEDULED',
    AUTO = 'AUTO',
}

@Entity('backup_logs')
export class BackupLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    companyId: string;

    @Column({ type: 'text' })
    backupType: BackupType;

    @Column({ type: 'text' })
    status: BackupStatus;

    @Column()
    fileName: string;

    @Column({ nullable: true })
    filePath: string;

    @Column({ type: 'integer', nullable: true })
    fileSize: number;

    @Column({ nullable: true })
    checksum: string;

    @Column({ type: 'text', nullable: true })
    errorMessage: string;

    @Column()
    createdBy: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ type: 'datetime', nullable: true })
    completedAt: Date;
}
