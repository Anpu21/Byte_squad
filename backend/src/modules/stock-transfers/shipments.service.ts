import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataSource, type EntityManager } from 'typeorm';
import { Shipment } from '@stock-transfers/entities/shipment.entity';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Employee } from '@/modules/hr/entities/employee.entity';
import { ShipmentsRepository } from '@stock-transfers/shipments.repository';
import { StockTransfersRepository } from '@stock-transfers/stock-transfers.repository';
import { EmployeesRepository } from '@/modules/hr/employees.repository';
import { UsersService } from '@users/users.service';
import { CreateShipmentDto } from '@stock-transfers/dto/create-shipment.dto';
import { AssignCourierDto } from '@stock-transfers/dto/assign-courier.dto';
import { ShipmentCheckpointDto } from '@stock-transfers/dto/shipment-checkpoint.dto';
import { ReturnShipmentDto } from '@stock-transfers/dto/return-shipment.dto';
import { ListShipmentsQueryDto } from '@stock-transfers/dto/list-shipments-query.dto';
import { ShipmentStatus } from '@common/enums/shipment-status.enum';
import { ShipmentEventType } from '@common/enums/shipment-event-type.enum';
import { TransferStatus } from '@common/enums/transfer-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { NotificationType } from '@common/enums/notification.enum';
import { NotificationsService } from '@notifications/notifications.service';
import { RealtimePublisher } from '@common/realtime/realtime-publisher.service';

interface ActorContext {
  id: string;
  branchId: string | null;
  role: UserRole;
}

export interface PaginatedShipments {
  items: Shipment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEFAULT_ETA_HOURS = 24;

@Injectable()
export class ShipmentsService {
  private readonly logger = new Logger(ShipmentsService.name);

  constructor(
    private readonly shipments: ShipmentsRepository,
    private readonly transfers: StockTransfersRepository,
    private readonly employees: EmployeesRepository,
    private readonly users: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly realtime: RealtimePublisher,
    private readonly dataSource: DataSource,
  ) {}

  // ── Reads ──────────────────────────────────────────────────────────────

  async list(
    actor: ActorContext,
    query: ListShipmentsQueryDto,
  ): Promise<PaginatedShipments> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    // A worker only ever sees the shipments they courier. With no linked
    // employee they have none — return empty rather than feed a non-uuid
    // sentinel into the (uuid) courier filter.
    let courierEmployeeId: string | null = null;
    if (actor.role === UserRole.WORKER) {
      const employee = await this.employees.findByUserId(actor.id);
      if (!employee) {
        return { items: [], total: 0, page, limit, totalPages: 1 };
      }
      courierEmployeeId = employee.id;
    }

    const raw = await this.shipments.list({
      actorRole: actor.role,
      actorBranchId: actor.branchId,
      courierEmployeeId,
      status: query.status,
      branchId: query.branchId,
      page,
      limit,
    });
    return {
      items: raw.items,
      total: raw.total,
      page,
      limit,
      totalPages: Math.ceil(raw.total / limit) || 1,
    };
  }

  async findById(id: string, actor: ActorContext): Promise<Shipment> {
    const shipment = await this.findByIdOrThrow(id);
    if (actor.role === UserRole.ADMIN) return shipment;

    const onBranch =
      shipment.sourceBranchId === actor.branchId ||
      shipment.destinationBranchId === actor.branchId;
    const isCourier = await this.actorIsAssignedCourier(actor, shipment);
    if (!onBranch && !isCourier) {
      throw new ForbiddenException('You do not have access to this shipment');
    }
    return shipment;
  }

  // ── Create ─────────────────────────────────────────────────────────────

  async createFromLines(
    actor: ActorContext,
    dto: CreateShipmentDto,
  ): Promise<Shipment> {
    const lines = await this.transfers.findByIds(dto.lineIds);
    if (lines.length !== dto.lineIds.length) {
      throw new NotFoundException('One or more transfer lines were not found');
    }
    for (const line of lines) {
      if (line.status !== TransferStatus.APPROVED) {
        throw new BadRequestException(
          `Line ${line.id} is "${line.status}" — only approved lines can ship`,
        );
      }
      if (line.shipmentId) {
        throw new ConflictException(`Line ${line.id} is already in a shipment`);
      }
      if (!line.sourceBranchId || line.approvedQuantity == null) {
        throw new BadRequestException(
          `Line ${line.id} is missing a source branch or approved quantity`,
        );
      }
    }

    const sourceBranchId = lines[0].sourceBranchId;
    const destinationBranchId = lines[0].destinationBranchId;
    if (sourceBranchId === null) {
      throw new BadRequestException('Lines are missing a source branch');
    }
    for (const line of lines) {
      if (
        line.sourceBranchId !== sourceBranchId ||
        line.destinationBranchId !== destinationBranchId
      ) {
        throw new BadRequestException(
          'All lines in a shipment must share the same source and destination',
        );
      }
    }

    this.assertManagesSource(actor, sourceBranchId);

    const batchIds = new Set(
      lines.map((l) => l.batchId).filter((b): b is string => Boolean(b)),
    );
    const batchId = batchIds.size === 1 ? [...batchIds][0] : null;

    const courier = dto.courierEmployeeId
      ? await this.resolveCourier(dto.courierEmployeeId, sourceBranchId)
      : null;

    const trackingRef = this.makeTrackingRef();
    const eta = dto.etaHours
      ? new Date(Date.now() + dto.etaHours * 3_600_000)
      : null;

    const saved = await this.dataSource.transaction(async (manager) => {
      const shipmentRepo = manager.getRepository(Shipment);
      const lineRepo = manager.getRepository(StockTransferRequest);

      const shipment = await shipmentRepo.save(
        shipmentRepo.create({
          trackingRef,
          batchId,
          sourceBranchId,
          destinationBranchId,
          status: courier
            ? ShipmentStatus.READY_TO_SHIP
            : ShipmentStatus.PENDING,
          courierEmployeeId: courier?.id ?? null,
          eta,
          createdByUserId: actor.id,
        }),
      );

      // Conditional link guards against a concurrent ship/cancel grabbing the
      // same lines: only still-approved, unlinked rows are claimed, and the
      // affected count must match exactly or the whole batch rolls back.
      const linkResult = await lineRepo
        .createQueryBuilder()
        .update(StockTransferRequest)
        .set({ shipmentId: shipment.id })
        .where('id IN (:...ids)', { ids: dto.lineIds })
        .andWhere('status = :status', { status: TransferStatus.APPROVED })
        .andWhere('shipment_id IS NULL')
        .execute();
      if (linkResult.affected !== dto.lineIds.length) {
        throw new ConflictException(
          'Some lines changed state while creating the shipment',
        );
      }

      await this.appendEvent(manager, {
        shipmentId: shipment.id,
        type: ShipmentEventType.CREATED,
        actorUserId: actor.id,
        note: `Shipment created with ${lines.length} item(s)`,
      });
      if (courier) {
        await this.appendEvent(manager, {
          shipmentId: shipment.id,
          type: ShipmentEventType.COURIER_ASSIGNED,
          actorUserId: actor.id,
          note: `Courier assigned: ${courier.fullName}`,
        });
      }
      return shipment;
    });

    await this.notify(saved.id, {
      branchIds: [sourceBranchId, destinationBranchId],
      courierUserId: courier?.userId ?? null,
      title: 'New shipment created',
      message: `Shipment ${trackingRef} created with ${lines.length} item(s)`,
      event: 'shipment_created',
    });
    return this.findByIdOrThrow(saved.id);
  }

  // ── Courier assignment ─────────────────────────────────────────────────

  async assignCourier(
    id: string,
    dto: AssignCourierDto,
    actor: ActorContext,
  ): Promise<Shipment> {
    const shipment = await this.findByIdOrThrow(id);
    this.assertManagesSource(actor, shipment.sourceBranchId);
    if (
      shipment.status === ShipmentStatus.DELIVERED ||
      shipment.status === ShipmentStatus.CANCELLED ||
      shipment.status === ShipmentStatus.RETURNED
    ) {
      throw new BadRequestException(
        `Cannot assign a courier to a ${shipment.status} shipment`,
      );
    }
    const courier = await this.resolveCourier(
      dto.courierEmployeeId,
      shipment.sourceBranchId,
    );

    shipment.courierEmployeeId = courier.id;
    if (shipment.status === ShipmentStatus.PENDING) {
      shipment.status = ShipmentStatus.READY_TO_SHIP;
    }
    await this.shipments.save(shipment);
    await this.shipments.appendEvent({
      shipmentId: id,
      type: ShipmentEventType.COURIER_ASSIGNED,
      actorUserId: actor.id,
      note: `Courier assigned: ${courier.fullName}`,
    });
    return this.findByIdOrThrow(id);
  }

  // ── Dispatch (decrement source — F1 atomic) ──────────────────────────────

  async dispatch(id: string, actor: ActorContext): Promise<Shipment> {
    const shipment = await this.findByIdOrThrow(id);
    await this.assertCourierOrBranchManager(actor, shipment, 'source');
    if (!shipment.courierEmployeeId) {
      throw new BadRequestException('Assign a courier before dispatching');
    }

    await this.dataSource.transaction(async (manager) => {
      const locked = await this.lockShipment(manager, id);
      if (locked.status !== ShipmentStatus.READY_TO_SHIP) {
        throw new BadRequestException(
          `Cannot dispatch a shipment in status "${locked.status}"`,
        );
      }
      const lineRepo = manager.getRepository(StockTransferRequest);
      const lines = await lineRepo.find({ where: { shipmentId: id } });
      for (const line of lines) {
        if (line.status !== TransferStatus.APPROVED) continue; // idempotent
        await this.moveStock(
          manager,
          line.productId,
          locked.sourceBranchId,
          -(line.approvedQuantity ?? 0),
        );
        line.status = TransferStatus.IN_TRANSIT;
        line.shippedByUserId = actor.id;
        line.shippedAt = new Date();
        await lineRepo.save(line);
      }
      locked.status = ShipmentStatus.DISPATCHED;
      locked.dispatchedByUserId = actor.id;
      locked.dispatchedAt = new Date();
      locked.eta =
        locked.eta ?? new Date(Date.now() + DEFAULT_ETA_HOURS * 3_600_000);
      await manager.getRepository(Shipment).save(locked);
      await this.appendEvent(manager, {
        shipmentId: id,
        type: ShipmentEventType.DISPATCHED,
        actorUserId: actor.id,
        location: `Left ${shipment.sourceBranch?.name ?? 'source branch'}`,
      });
    });

    await this.notify(id, {
      branchIds: [shipment.sourceBranchId, shipment.destinationBranchId],
      courierUserId: null,
      title: 'Shipment dispatched',
      message: `Shipment ${shipment.trackingRef} is on the way to ${shipment.destinationBranch?.name ?? 'destination'}`,
      event: 'shipment_dispatched',
    });
    return this.findByIdOrThrow(id);
  }

  // ── Waypoint scan ────────────────────────────────────────────────────────

  async addCheckpoint(
    id: string,
    dto: ShipmentCheckpointDto,
    actor: ActorContext,
  ): Promise<Shipment> {
    const shipment = await this.findByIdOrThrow(id);
    await this.assertCourierOrBranchManager(actor, shipment, 'either');
    if (shipment.status !== ShipmentStatus.DISPATCHED) {
      throw new BadRequestException(
        `Checkpoints can only be added to an in-transit shipment (is "${shipment.status}")`,
      );
    }
    await this.shipments.appendEvent({
      shipmentId: id,
      type: ShipmentEventType.CHECKPOINT,
      actorUserId: actor.id,
      location: dto.location,
      note: dto.note ?? null,
    });
    return this.findByIdOrThrow(id);
  }

  async markOutForDelivery(id: string, actor: ActorContext): Promise<Shipment> {
    const shipment = await this.findByIdOrThrow(id);
    await this.assertCourierOrBranchManager(actor, shipment, 'either');
    if (shipment.status !== ShipmentStatus.DISPATCHED) {
      throw new BadRequestException(
        `Cannot mark out-for-delivery from status "${shipment.status}"`,
      );
    }
    shipment.status = ShipmentStatus.OUT_FOR_DELIVERY;
    await this.shipments.save(shipment);
    await this.shipments.appendEvent({
      shipmentId: id,
      type: ShipmentEventType.OUT_FOR_DELIVERY,
      actorUserId: actor.id,
      location: `Arrived at ${shipment.destinationBranch?.name ?? 'destination'}`,
    });
    return this.findByIdOrThrow(id);
  }

  // ── Deliver (credit destination — F1 atomic) ─────────────────────────────

  async deliver(id: string, actor: ActorContext): Promise<Shipment> {
    const shipment = await this.findByIdOrThrow(id);
    await this.assertCourierOrBranchManager(actor, shipment, 'destination');

    await this.dataSource.transaction(async (manager) => {
      const locked = await this.lockShipment(manager, id);
      if (
        locked.status !== ShipmentStatus.DISPATCHED &&
        locked.status !== ShipmentStatus.OUT_FOR_DELIVERY
      ) {
        throw new BadRequestException(
          `Cannot deliver a shipment in status "${locked.status}"`,
        );
      }
      const lineRepo = manager.getRepository(StockTransferRequest);
      const lines = await lineRepo.find({ where: { shipmentId: id } });
      for (const line of lines) {
        if (line.status !== TransferStatus.IN_TRANSIT) continue; // idempotent
        await this.moveStock(
          manager,
          line.productId,
          locked.destinationBranchId,
          line.approvedQuantity ?? 0,
        );
        line.status = TransferStatus.COMPLETED;
        line.receivedByUserId = actor.id;
        line.receivedAt = new Date();
        await lineRepo.save(line);
      }
      locked.status = ShipmentStatus.DELIVERED;
      locked.deliveredByUserId = actor.id;
      locked.deliveredAt = new Date();
      await manager.getRepository(Shipment).save(locked);
      await this.appendEvent(manager, {
        shipmentId: id,
        type: ShipmentEventType.DELIVERED,
        actorUserId: actor.id,
        location: `Received at ${shipment.destinationBranch?.name ?? 'destination'}`,
      });
    });

    await this.notify(id, {
      branchIds: [shipment.sourceBranchId, shipment.destinationBranchId],
      courierUserId: null,
      title: 'Shipment delivered',
      message: `Shipment ${shipment.trackingRef} was delivered to ${shipment.destinationBranch?.name ?? 'destination'}`,
      event: 'shipment_delivered',
    });
    return this.findByIdOrThrow(id);
  }

  // ── Return (re-credit source — F4) ───────────────────────────────────────

  async returnShipment(
    id: string,
    dto: ReturnShipmentDto,
    actor: ActorContext,
  ): Promise<Shipment> {
    const shipment = await this.findByIdOrThrow(id);
    await this.assertCourierOrBranchManager(actor, shipment, 'source');

    await this.dataSource.transaction(async (manager) => {
      const locked = await this.lockShipment(manager, id);
      if (
        locked.status !== ShipmentStatus.DISPATCHED &&
        locked.status !== ShipmentStatus.OUT_FOR_DELIVERY
      ) {
        throw new BadRequestException(
          `Cannot return a shipment in status "${locked.status}"`,
        );
      }
      const lineRepo = manager.getRepository(StockTransferRequest);
      const lines = await lineRepo.find({ where: { shipmentId: id } });
      for (const line of lines) {
        if (line.status !== TransferStatus.IN_TRANSIT) continue; // idempotent
        // Put the dispatched stock back on the source branch's books.
        await this.moveStock(
          manager,
          line.productId,
          locked.sourceBranchId,
          line.approvedQuantity ?? 0,
        );
        // Unlink so the line returns to the approved pool and can re-ship.
        line.status = TransferStatus.APPROVED;
        line.shipmentId = null;
        line.shippedByUserId = null;
        line.shippedAt = null;
        await lineRepo.save(line);
      }
      locked.status = ShipmentStatus.RETURNED;
      locked.returnedByUserId = actor.id;
      locked.returnedAt = new Date();
      locked.exceptionReason = dto.reason;
      await manager.getRepository(Shipment).save(locked);
      await this.appendEvent(manager, {
        shipmentId: id,
        type: ShipmentEventType.RETURNED,
        actorUserId: actor.id,
        note: dto.reason,
      });
    });

    await this.notify(id, {
      branchIds: [shipment.sourceBranchId, shipment.destinationBranchId],
      courierUserId: null,
      title: 'Shipment returned',
      message: `Shipment ${shipment.trackingRef} was returned: ${dto.reason}`,
      event: 'shipment_returned',
    });
    return this.findByIdOrThrow(id);
  }

  // ── Cancel (pre-dispatch, no stock moved) ────────────────────────────────

  async cancel(
    id: string,
    dto: ReturnShipmentDto,
    actor: ActorContext,
  ): Promise<Shipment> {
    const shipment = await this.findByIdOrThrow(id);
    this.assertManagesSource(actor, shipment.sourceBranchId);

    await this.dataSource.transaction(async (manager) => {
      const locked = await this.lockShipment(manager, id);
      if (
        locked.status !== ShipmentStatus.PENDING &&
        locked.status !== ShipmentStatus.READY_TO_SHIP
      ) {
        throw new BadRequestException(
          `Cannot cancel a shipment in status "${locked.status}" — it has already left`,
        );
      }
      // Release the lines back to the approved pool.
      await manager
        .getRepository(StockTransferRequest)
        .createQueryBuilder()
        .update(StockTransferRequest)
        .set({ shipmentId: null })
        .where('shipment_id = :id', { id })
        .execute();
      locked.status = ShipmentStatus.CANCELLED;
      locked.cancelledByUserId = actor.id;
      locked.cancelledAt = new Date();
      locked.exceptionReason = dto.reason;
      await manager.getRepository(Shipment).save(locked);
      await this.appendEvent(manager, {
        shipmentId: id,
        type: ShipmentEventType.CANCELLED,
        actorUserId: actor.id,
        note: dto.reason,
      });
    });

    await this.notify(id, {
      branchIds: [shipment.sourceBranchId, shipment.destinationBranchId],
      courierUserId: null,
      title: 'Shipment cancelled',
      message: `Shipment ${shipment.trackingRef} was cancelled`,
      event: 'shipment_cancelled',
    });
    return this.findByIdOrThrow(id);
  }

  // ── Internals ────────────────────────────────────────────────────────────

  private async findByIdOrThrow(id: string): Promise<Shipment> {
    const shipment = await this.shipments.findById(id);
    if (!shipment) {
      throw new NotFoundException('Shipment not found');
    }
    return shipment;
  }

  private async lockShipment(
    manager: EntityManager,
    id: string,
  ): Promise<Shipment> {
    const locked = await manager
      .getRepository(Shipment)
      .createQueryBuilder('s')
      .setLock('pessimistic_write')
      .where('s.id = :id', { id })
      .getOne();
    if (!locked) {
      throw new NotFoundException('Shipment not found');
    }
    return locked;
  }

  /**
   * Locked inventory move shared by every stock-touching transition. A
   * negative delta debits (and refuses to oversell); a positive delta credits
   * (creating the row on first receipt). The pessimistic lock serialises this
   * against concurrent POS sales and the row is re-read under the lock.
   */
  private async moveStock(
    manager: EntityManager,
    productId: string,
    branchId: string,
    delta: number,
  ): Promise<void> {
    if (delta === 0) return;
    const invRepo = manager.getRepository(Inventory);
    const row = await invRepo
      .createQueryBuilder('inv')
      .setLock('pessimistic_write')
      .where('inv.product_id = :productId', { productId })
      .andWhere('inv.branch_id = :branchId', { branchId })
      .getOne();

    if (delta < 0) {
      if (!row) {
        throw new BadRequestException(
          'Source branch no longer has an inventory record for an item',
        );
      }
      if (row.quantity < -delta) {
        throw new BadRequestException(
          `Source branch only has ${row.quantity} unit(s) — cannot move ${-delta}`,
        );
      }
      row.quantity += delta;
      await invRepo.save(row);
      return;
    }

    if (!row) {
      await invRepo.save(
        invRepo.create({
          productId,
          branchId,
          quantity: delta,
          lowStockThreshold: 10,
          lastRestockedAt: new Date(),
        }),
      );
    } else {
      row.quantity += delta;
      row.lastRestockedAt = new Date();
      await invRepo.save(row);
    }
  }

  private async appendEvent(
    manager: EntityManager,
    input: {
      shipmentId: string;
      type: ShipmentEventType;
      actorUserId: string | null;
      location?: string | null;
      note?: string | null;
    },
  ): Promise<void> {
    await this.shipments.appendEvent(
      {
        shipmentId: input.shipmentId,
        type: input.type,
        actorUserId: input.actorUserId,
        location: input.location ?? null,
        note: input.note ?? null,
      },
      manager,
    );
  }

  private makeTrackingRef(): string {
    return `SHP-${randomUUID().slice(0, 8).toUpperCase()}`;
  }

  private async resolveCourier(
    courierEmployeeId: string,
    sourceBranchId: string,
  ): Promise<Employee> {
    const courier = await this.employees.findById(courierEmployeeId);
    if (!courier) {
      throw new NotFoundException('Courier employee not found');
    }
    if (courier.status !== 'Active') {
      throw new BadRequestException(
        `Courier ${courier.employeeCode} is ${courier.status}`,
      );
    }
    if (courier.branchId !== sourceBranchId) {
      throw new BadRequestException(
        'Courier must belong to the shipment source branch',
      );
    }
    return courier;
  }

  private assertManagesSource(
    actor: ActorContext,
    sourceBranchId: string,
  ): void {
    if (actor.role === UserRole.ADMIN) return;
    if (actor.role === UserRole.MANAGER && actor.branchId === sourceBranchId) {
      return;
    }
    throw new ForbiddenException(
      'Only an admin or the source-branch manager can do this',
    );
  }

  /**
   * Courier-facing transitions: allowed for an admin, the relevant branch
   * manager (source / destination / either), or the assigned courier worker.
   */
  private async assertCourierOrBranchManager(
    actor: ActorContext,
    shipment: Shipment,
    side: 'source' | 'destination' | 'either',
  ): Promise<void> {
    if (actor.role === UserRole.ADMIN) return;
    if (actor.role === UserRole.MANAGER) {
      const ok =
        (side === 'source' && actor.branchId === shipment.sourceBranchId) ||
        (side === 'destination' &&
          actor.branchId === shipment.destinationBranchId) ||
        (side === 'either' &&
          (actor.branchId === shipment.sourceBranchId ||
            actor.branchId === shipment.destinationBranchId));
      if (ok) return;
    }
    if (await this.actorIsAssignedCourier(actor, shipment)) return;
    throw new ForbiddenException(
      'Only the assigned courier or the relevant branch manager can do this',
    );
  }

  private async actorIsAssignedCourier(
    actor: ActorContext,
    shipment: Shipment,
  ): Promise<boolean> {
    if (actor.role !== UserRole.WORKER || !shipment.courierEmployeeId) {
      return false;
    }
    const employee = await this.employees.findByUserId(actor.id);
    return employee?.id === shipment.courierEmployeeId;
  }

  /**
   * Best-effort notification fan-out (audit finding F3). Runs after the
   * transition has committed and never throws — a notification failure can
   * never roll back or 500 a successful delivery transition.
   */
  private async notify(
    shipmentId: string,
    payload: {
      branchIds: string[];
      courierUserId: string | null;
      title: string;
      message: string;
      event: string;
    },
  ): Promise<void> {
    try {
      const branchIds = payload.branchIds.filter(Boolean);
      const recipients =
        branchIds.length > 0
          ? await this.users.findManagersAndAdminsForBranches(branchIds)
          : [];
      const userIds = new Set(recipients.map((u) => u.id));
      if (payload.courierUserId) userIds.add(payload.courierUserId);

      await Promise.allSettled(
        [...userIds].map(async (userId) => {
          await this.notificationsService.create({
            userId,
            title: payload.title,
            message: payload.message,
            type: NotificationType.STOCK_TRANSFER,
            metadata: { event: payload.event, shipmentId },
          });
          this.realtime.toUser(userId, {
            userId,
            title: payload.title,
            message: payload.message,
            type: NotificationType.STOCK_TRANSFER,
          });
        }),
      );
    } catch (err) {
      // Best-effort notification — must not fail the transfer, but never silent.
      this.logger.warn(
        `Failed to send stock-transfer notification: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
