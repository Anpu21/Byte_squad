import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type DeepPartial, type EntityManager } from 'typeorm';
import { Shipment } from '@stock-transfers/entities/shipment.entity';
import { ShipmentEvent } from '@stock-transfers/entities/shipment-event.entity';
import { ShipmentStatus } from '@common/enums/shipment-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';

const SHIPMENT_RELATIONS = [
  'sourceBranch',
  'destinationBranch',
  'courier',
  'lines',
  'lines.product',
  'events',
  'events.actor',
];

export interface ListShipmentsFilter {
  actorRole: UserRole;
  actorBranchId: string | null;
  /** When the actor is a worker, restrict to shipments they courier. */
  courierEmployeeId?: string | null;
  status?: ShipmentStatus;
  /** Admin-only explicit branch filter (source OR destination). */
  branchId?: string;
  page: number;
  limit: number;
}

export interface PaginatedShipmentsRaw {
  items: Shipment[];
  total: number;
}

/**
 * Repository for {@link Shipment} reads + simple writes. The transactional
 * lifecycle transitions (dispatch / deliver / return) run in the service with
 * a pessimistic lock via the passed {@link EntityManager}, mirroring the
 * existing transfer ship/receive discipline.
 */
@Injectable()
export class ShipmentsRepository {
  constructor(
    @InjectRepository(Shipment)
    private readonly repo: Repository<Shipment>,
    @InjectRepository(ShipmentEvent)
    private readonly eventsRepo: Repository<ShipmentEvent>,
  ) {}

  create(partial: DeepPartial<Shipment>): Promise<Shipment> {
    return this.repo.save(this.repo.create(partial));
  }

  save(shipment: Shipment): Promise<Shipment> {
    return this.repo.save(shipment);
  }

  async findById(id: string): Promise<Shipment | null> {
    const shipment = await this.repo.findOne({
      where: { id },
      relations: SHIPMENT_RELATIONS,
    });
    if (shipment?.events) {
      shipment.events.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
    }
    return shipment;
  }

  /** Append a tracking-timeline row. Pass a manager to join a transaction. */
  async appendEvent(
    input: DeepPartial<ShipmentEvent>,
    manager?: EntityManager,
  ): Promise<ShipmentEvent> {
    const r = manager
      ? manager.getRepository(ShipmentEvent)
      : this.eventsRepo;
    return r.save(r.create(input));
  }

  async list(filter: ListShipmentsFilter): Promise<PaginatedShipmentsRaw> {
    const qb = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.sourceBranch', 'sourceBranch')
      .leftJoinAndSelect('s.destinationBranch', 'destinationBranch')
      .leftJoinAndSelect('s.courier', 'courier')
      .leftJoinAndSelect('s.lines', 'lines')
      .leftJoinAndSelect('lines.product', 'product')
      .orderBy('s.createdAt', 'DESC');

    if (filter.status) {
      qb.andWhere('s.status = :status', { status: filter.status });
    }

    if (filter.actorRole !== UserRole.ADMIN) {
      if (filter.courierEmployeeId) {
        qb.andWhere('s.courier_employee_id = :cid', {
          cid: filter.courierEmployeeId,
        });
      } else {
        qb.andWhere(
          '(s.source_branch_id = :ab OR s.destination_branch_id = :ab)',
          { ab: filter.actorBranchId },
        );
      }
    } else if (filter.branchId) {
      qb.andWhere(
        '(s.source_branch_id = :b OR s.destination_branch_id = :b)',
        { b: filter.branchId },
      );
    }

    const [items, total] = await qb
      .skip((filter.page - 1) * filter.limit)
      .take(filter.limit)
      .getManyAndCount();
    return { items, total };
  }
}
