import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Append-only activity log: one row per mutating API call (POST/PATCH/
 * PUT/DELETE), captured by the global audit interceptor. Deliberately
 * stores NO request bodies — paths and outcomes only — so secrets and
 * personal data never land in the log.
 */
@Entity('audit_logs')
@Index(['createdAt'])
@Index(['userId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 32, name: 'user_role', nullable: true })
  userRole!: string | null;

  @Column({ type: 'varchar', length: 8 })
  method!: string;

  @Column({ type: 'varchar', length: 255 })
  path!: string;

  @Column({ type: 'integer', name: 'status_code' })
  statusCode!: number;

  @Column({ type: 'integer', name: 'duration_ms' })
  durationMs!: number;

  @Column({ type: 'uuid', name: 'branch_id', nullable: true })
  branchId!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
