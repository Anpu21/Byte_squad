import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '@users/entities/user.entity';
import { ShipmentEventType } from '@common/enums/shipment-event-type.enum';
import { Shipment } from '@stock-transfers/entities/shipment.entity';

/**
 * Append-only entry on a shipment's tracking timeline. Never updated or
 * deleted — each transition and each courier waypoint scan adds one row, and
 * the ordered set IS the AliExpress-style delivery feed shown to the user.
 */
@Entity('shipment_events')
@Index(['shipmentId', 'createdAt'])
export class ShipmentEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'shipment_id' })
  shipmentId!: string;

  @ManyToOne(() => Shipment, (shipment) => shipment.events, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipment_id' })
  shipment!: Shipment;

  @Column({ type: 'varchar', length: 24 })
  type!: ShipmentEventType;

  /** Free-text waypoint, e.g. "Left Main Branch" or "At Downtown dock". */
  @Column({ type: 'varchar', length: 160, nullable: true })
  location!: string | null;

  @Column({ type: 'text', nullable: true })
  note!: string | null;

  @Column({ type: 'uuid', name: 'actor_user_id', nullable: true })
  actorUserId!: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'actor_user_id' })
  actor!: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
