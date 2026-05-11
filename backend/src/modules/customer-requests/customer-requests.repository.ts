import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CustomerRequest } from '@/modules/customer-requests/entities/customer-request.entity';
import { CustomerRequestItem } from '@/modules/customer-requests/entities/customer-request-item.entity';
import { CustomerRequestStatus } from '@common/enums/customer-request.enum';
import { UserRole } from '@common/enums/user-roles.enums';

export interface ListForStaffFilter {
  actorRole: UserRole;
  actorBranchId: string | null;
  branchId?: string | null;
  status?: CustomerRequestStatus | null;
  q?: string | null;
  limit: number;
}

@Injectable()
export class CustomerRequestsRepository {
  constructor(
    @InjectRepository(CustomerRequest)
    private readonly requestRepo: Repository<CustomerRequest>,
    @InjectRepository(CustomerRequestItem)
    private readonly itemRepo: Repository<CustomerRequestItem>,
  ) {}

  buildItem(partial: DeepPartial<CustomerRequestItem>): CustomerRequestItem {
    return this.itemRepo.create(partial);
  }

  async createAndSave(
    partial: DeepPartial<CustomerRequest>,
  ): Promise<CustomerRequest> {
    const entity = this.requestRepo.create(partial);
    return this.requestRepo.save(entity);
  }

  async findById(id: string): Promise<CustomerRequest | null> {
    return this.requestRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'branch', 'user'],
    });
  }

  async findByCode(code: string): Promise<CustomerRequest | null> {
    return this.requestRepo.findOne({
      where: { requestCode: code },
      relations: ['items', 'items.product', 'branch', 'user'],
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const found = await this.requestRepo.findOne({
      where: { requestCode: code },
      select: { id: true },
    });
    return found !== null;
  }

  async listForUser(userId: string): Promise<CustomerRequest[]> {
    return this.requestRepo.find({
      where: { userId },
      relations: ['items', 'items.product', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async listForStaff(filter: ListForStaffFilter): Promise<CustomerRequest[]> {
    const qb = this.requestRepo
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('req.branch', 'branch')
      .leftJoinAndSelect('req.user', 'user')
      .orderBy('req.createdAt', 'DESC')
      .take(filter.limit);

    if (filter.actorRole !== UserRole.ADMIN) {
      qb.andWhere('req.branch_id = :branchId', {
        branchId: filter.actorBranchId,
      });
    } else if (filter.branchId) {
      qb.andWhere('req.branch_id = :branchId', { branchId: filter.branchId });
    }

    if (filter.status) {
      qb.andWhere('req.status = :status', { status: filter.status });
    } else if (filter.actorRole === UserRole.CASHIER) {
      // Cashiers only need actionable + today's completed; rejected/cancelled
      // /expired are noise on a fulfillment screen.
      qb.andWhere('req.status IN (:...visibleToCashier)', {
        visibleToCashier: [
          CustomerRequestStatus.PENDING,
          CustomerRequestStatus.ACCEPTED,
          CustomerRequestStatus.COMPLETED,
        ],
      });
    }

    if (filter.q) {
      qb.andWhere(
        "(LOWER(req.request_code) LIKE LOWER(:q) OR LOWER(COALESCE(req.guest_name, '')) LIKE LOWER(:q))",
        { q: `%${filter.q}%` },
      );
    }

    return qb.getMany();
  }

  async updateStatus(
    id: string,
    status: CustomerRequestStatus,
    extra?: Partial<Pick<CustomerRequest, 'fulfilledTransactionId'>>,
  ): Promise<void> {
    await this.requestRepo.update(id, { status, ...(extra ?? {}) });
  }

  async setQrCodeUrl(id: string, qrCodeUrl: string): Promise<void> {
    await this.requestRepo.update(id, { qrCodeUrl });
  }
}
