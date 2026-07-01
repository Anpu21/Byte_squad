import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * Opaque, rotating refresh token. Only the SHA-256 hash of the raw token is
 * persisted (the raw value is returned to the client once and never stored).
 * Tokens minted from one login share a `family` so a detected reuse can revoke
 * the whole chain.
 */
@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId!: string;

  @Column({ type: 'varchar', name: 'token_hash', length: 64, unique: true })
  tokenHash!: string;

  @Index()
  @Column({ type: 'uuid' })
  family!: string;

  @Column({ type: 'timestamp', name: 'expires_at' })
  expiresAt!: Date;

  @Column({ type: 'timestamp', name: 'revoked_at', nullable: true })
  revokedAt!: Date | null;

  @Column({
    type: 'varchar',
    name: 'replaced_by_token_hash',
    length: 64,
    nullable: true,
  })
  replacedByTokenHash!: string | null;

  @Column({ type: 'varchar', name: 'user_agent', length: 255, nullable: true })
  userAgent!: string | null;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ip!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
