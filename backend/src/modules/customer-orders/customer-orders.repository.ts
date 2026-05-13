import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { CustomerOrderItem } from '@/modules/customer-orders/entities/customer-order-item.entity';
import { PayherePaymentAttempt } from '@/modules/customer-orders/entities/payhere-payment-attempt.entity';
import { CustomerOrderStatus } from '@common/enums/customer-order.enum';
import { CustomerOrderPaymentStatus } from '@common/enums/customer-order-payment-status.enum';
import { PayherePaymentAttemptStatus } from '@common/enums/payhere-payment-attempt-status.enum';
import { UserRole } from '@common/enums/user-roles.enums';

export interface ListForStaffFilter {
  actorRole: UserRole;
  actorBranchId: string | null;
  branchId?: string | null;
  status?: CustomerOrderStatus | null;
  q?: string | null;
  limit: number;
}

@Injectable()
export class CustomerOrdersRepository {
  constructor(
    @InjectRepository(CustomerOrder)
    private readonly orderRepo: Repository<CustomerOrder>,
    @InjectRepository(CustomerOrderItem)
    private readonly itemRepo: Repository<CustomerOrderItem>,
    @InjectRepository(PayherePaymentAttempt)
    private readonly attemptRepo: Repository<PayherePaymentAttempt>,
  ) {}

  buildItem(partial: DeepPartial<CustomerOrderItem>): CustomerOrderItem {
    return this.itemRepo.create(partial);
  }

  async createAndSave(
    partial: DeepPartial<CustomerOrder>,
  ): Promise<CustomerOrder> {
    const entity = this.orderRepo.create(partial);
    return this.orderRepo.save(entity);
  }

  async findById(id: string): Promise<CustomerOrder | null> {
    return this.orderRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'branch', 'user', 'paymentAttempts'],
    });
  }

  async findByCode(code: string): Promise<CustomerOrder | null> {
    return this.orderRepo.findOne({
      where: { orderCode: code },
      relations: ['items', 'items.product', 'branch', 'user', 'paymentAttempts'],
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const found = await this.orderRepo.findOne({
      where: { orderCode: code },
      select: { id: true },
    });
    return found !== null;
  }

  async listForUser(userId: string): Promise<CustomerOrder[]> {
    return this.orderRepo.find({
      where: { userId },
      relations: ['items', 'items.product', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async listForStaff(filter: ListForStaffFilter): Promise<CustomerOrder[]> {
    const qb = this.orderRepo
      .createQueryBuilder('ord')
      .leftJoinAndSelect('ord.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('ord.branch', 'branch')
      .leftJoinAndSelect('ord.user', 'user')
      .orderBy('ord.createdAt', 'DESC')
      .take(filter.limit);

    if (filter.actorRole !== UserRole.ADMIN) {
      qb.andWhere('ord.branch_id = :branchId', {
        branchId: filter.actorBranchId,
      });
    } else if (filter.branchId) {
      qb.andWhere('ord.branch_id = :branchId', {
        branchId: filter.branchId,
      });
    }

    if (filter.status) {
      qb.andWhere('ord.status = :status', { status: filter.status });
    } else if (filter.actorRole === UserRole.CASHIER) {
      // Cashiers only need actionable + today's completed; rejected/cancelled
      // /expired are noise on a fulfillment screen.
      qb.andWhere('ord.status IN (:...visibleToCashier)', {
        visibleToCashier: [
          CustomerOrderStatus.PENDING,
          CustomerOrderStatus.ACCEPTED,
          CustomerOrderStatus.COMPLETED,
        ],
      });
    }

    if (filter.q) {
      qb.andWhere(
        "(LOWER(ord.order_code) LIKE LOWER(:q) OR LOWER(COALESCE(ord.guest_name, '')) LIKE LOWER(:q))",
        { q: `%${filter.q}%` },
      );
    }

    return qb.getMany();
  }

  async updateStatus(
    id: string,
    status: CustomerOrderStatus,
    extra?: Partial<
      Pick<
        CustomerOrder,
        'fulfilledTransactionId' | 'paymentStatus' | 'loyaltyPointsEarned'
      >
    >,
  ): Promise<void> {
    await this.orderRepo.update(id, { status, ...(extra ?? {}) });
  }

  async setQrCodeUrl(id: string, qrCodeUrl: string): Promise<void> {
    await this.orderRepo.update(id, { qrCodeUrl });
  }

  async updateFinancials(
    id: string,
    partial: Partial<
      Pick<
        CustomerOrder,
        | 'loyaltyDiscountAmount'
        | 'finalTotal'
        | 'loyaltyPointsRedeemed'
        | 'paymentStatus'
      >
    >,
  ): Promise<void> {
    await this.orderRepo.update(id, partial);
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: CustomerOrderPaymentStatus,
  ): Promise<void> {
    await this.orderRepo.update(id, { paymentStatus });
  }

  async createPaymentAttempt(
    partial: DeepPartial<PayherePaymentAttempt>,
  ): Promise<PayherePaymentAttempt> {
    return this.attemptRepo.save(this.attemptRepo.create(partial));
  }

  async findPaymentAttemptByProviderOrderId(
    providerOrderId: string,
  ): Promise<PayherePaymentAttempt | null> {
    return this.attemptRepo.findOne({
      where: { providerOrderId },
      relations: ['order', 'order.items', 'order.items.product', 'order.user'],
    });
  }

  async updatePaymentAttempt(
    id: string,
    partial: Partial<
      Pick<
        PayherePaymentAttempt,
        | 'status'
        | 'signatureValid'
        | 'payherePaymentId'
        | 'notifyPayload'
        | 'paidAt'
        | 'failedAt'
      >
    >,
  ): Promise<void> {
    await this.attemptRepo.update(id, partial);
  }

  async hasSuccessfulPaymentAttempt(orderId: string): Promise<boolean> {
    const found = await this.attemptRepo.findOne({
      where: { orderId, status: PayherePaymentAttemptStatus.PAID },
      select: { id: true },
    });
    return found !== null;
  }
}
