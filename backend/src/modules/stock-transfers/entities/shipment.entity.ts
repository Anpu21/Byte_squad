import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { Employee } from '@/modules/hr/entities/employee.entity';
import { ShipmentStatus } from '@common/enums/shipment-status.enum';
import { ShipmentEvent } from '@stock-transfers/entities/shipment-event.entity';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';

/**
 * A courier-driven parcel grouping one or more approved stock-transfer lines
 * that travel together from one source branch to one destination branch.
 *
 * Lines are grouped by (sourceBranchId, destinationBranchId) — a single
 * manager request `batchId` whose lines were approved from different sources
 * therefore splits into one shipment per source. `batchId` is carried only for
 * provenance. The delivery lifecycle lives here (see {@link ShipmentStatus});
 * the lines keep their own `TransferStatus` for the request/approval stage.
 */
@Entity('shipments')
@Index(['status', 'createdAt'])
@Index(['destinationBranchId', 'status'])
@Index(['sourceBranchId', 'status'])
@Index(['courierEmployeeId', 'status'])
export class Shipment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Human-friendly tracking code surfaced in the UI (e.g. SHP-A1B2C3D4). */
  @Column({ type: 'varchar', length: 32, name: 'tracking_ref', unique: true })
  trackingRef!: string;

  /** Provenance link to the originating request batch, when there was one. */
  @Column({ type: 'uuid', name: 'batch_id', nullable: true })
  @Index()
  batchId!: string | null;

  @Column({ type: 'uuid', name: 'source_branch_id' })
  sourceBranchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'source_branch_id' })
  sourceBranch!: Branch;

  @Column({ type: 'uuid', name: 'destination_branch_id' })
  destinationBranchId!: string;

  @ManyToOne(() => Branch, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destination_branch_id' })
  destinationBranch!: Branch;

  @Column({
    type: 'varchar',
    length: 24,
    default: ShipmentStatus.PENDING,
  })
  status!: ShipmentStatus;

  /** Assigned courier (a WORKER's HR employee row). Null until assigned. */
  @Column({ type: 'uuid', name: 'courier_employee_id', nullable: true })
  courierEmployeeId!: string | null;

  @ManyToOne(() => Employee, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courier_employee_id' })
  courier!: Employee | null;

  /** Estimated delivery time, set at dispatch. */
  @Column({ type: 'timestamp', name: 'eta', nullable: true })
  eta!: Date | null;

  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdBy!: User;

  @Column({ type: 'uuid', name: 'dispatched_by_user_id', nullable: true })
  dispatchedByUserId!: string | null;

  @Column({ type: 'timestamp', name: 'dispatched_at', nullable: true })
  dispatchedAt!: Date | null;

  @Column({ type: 'uuid', name: 'delivered_by_user_id', nullable: true })
  deliveredByUserId!: string | null;

  @Column({ type: 'timestamp', name: 'delivered_at', nullable: true })
  deliveredAt!: Date | null;

  @Column({ type: 'uuid', name: 'returned_by_user_id', nullable: true })
  returnedByUserId!: string | null;

  @Column({ type: 'timestamp', name: 'returned_at', nullable: true })
  returnedAt!: Date | null;

  @Column({ type: 'uuid', name: 'cancelled_by_user_id', nullable: true })
  cancelledByUserId!: string | null;

  @Column({ type: 'timestamp', name: 'cancelled_at', nullable: true })
  cancelledAt!: Date | null;

  /** Reason captured on a RETURNED / CANCELLED transition. */
  @Column({ type: 'text', name: 'exception_reason', nullable: true })
  exceptionReason!: string | null;

  /** The approved transfer lines travelling in this shipment. */
  @OneToMany(() => StockTransferRequest, (line) => line.shipment)
  lines!: StockTransferRequest[];

  @OneToMany(() => ShipmentEvent, (event) => event.shipment)
  events!: ShipmentEvent[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
