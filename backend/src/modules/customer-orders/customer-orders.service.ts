import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { CustomerOrdersRepository } from '@/modules/customer-orders/customer-orders.repository';
import { CreateCustomerOrderDto } from '@/modules/customer-orders/dto/create-customer-order.dto';
import { CheckoutCustomerOrderDto } from '@/modules/customer-orders/dto/checkout-customer-order.dto';
import { FulfillCustomerOrderDto } from '@/modules/customer-orders/dto/fulfill-customer-order.dto';
import { ListCustomerOrdersQueryDto } from '@/modules/customer-orders/dto/list-customer-orders-query.dto';
import {
  PayhereCheckoutPayload,
  PayhereNotifyPayload,
  PayhereService,
} from '@/modules/customer-orders/payhere.service';
import { LoyaltyService } from '@/modules/loyalty/loyalty.service';
import { LoyaltyWalletService } from '@/modules/loyalty/loyalty-wallet.service';
import { ProductsService } from '@products/products.service';
import { BranchesService } from '@branches/branches.service';
import { UsersService } from '@users/users.service';
import { PosService } from '@pos/pos.service';
import { AccountingService } from '@accounting/accounting.service';
import { InventoryService } from '@inventory/inventory.service';
import { Sale } from '@pos/entities/sale.entity';
import { CustomerOrderStatus } from '@common/enums/customer-order.enum';
import { CustomerOrderPaymentMode } from '@common/enums/customer-order-payment-mode.enum';
import { CustomerOrderPaymentStatus } from '@common/enums/customer-order-payment-status.enum';
import { PayherePaymentAttemptStatus } from '@common/enums/payhere-payment-attempt-status.enum';
import { TransactionType } from '@common/enums/transaction.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { NotificationType } from '@common/enums/notification.enum';
import { PaymentMethod } from '@common/enums/payment-method';
import { UserRole } from '@common/enums/user-roles.enums';
import { NotificationsService } from '@notifications/notifications.service';
import { RealtimePublisher } from '@common/realtime/realtime-publisher.service';

const ORDER_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CURRENCY = 'LKR';

interface StaffActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

export interface CreateCustomerOrderResult {
  order: CustomerOrder;
  payment: PayhereCheckoutPayload | null;
}

export interface CreateCheckoutResult {
  groupCode: string;
  orders: CustomerOrder[];
  payment: PayhereCheckoutPayload | null;
}

interface EffectiveOrderItem {
  productId: string;
  quantity: number;
  baseUnitQty?: number;
  unitPriceSnapshot?: number;
  fixedPriceOverride?: number | null;
}

@Injectable()
export class CustomerOrdersService {
  private readonly logger = new Logger(CustomerOrdersService.name);

  constructor(
    private readonly orders: CustomerOrdersRepository,
    private readonly products: ProductsService,
    private readonly branches: BranchesService,
    private readonly users: UsersService,
    private readonly pos: PosService,
    private readonly accounting: AccountingService,
    private readonly inventory: InventoryService,
    private readonly loyalty: LoyaltyService,
    private readonly loyaltyWallet: LoyaltyWalletService,
    private readonly notifications: NotificationsService,
    private readonly realtime: RealtimePublisher,
    private readonly cloudinary: CloudinaryService,
    private readonly payhere: PayhereService,
  ) {}

  private async generateAndStoreQrCode(
    order: CustomerOrder,
  ): Promise<string | null> {
    try {
      const buffer = await QRCode.toBuffer(order.orderCode, {
        width: 512,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      const { url } = await this.cloudinary.uploadBuffer(buffer, {
        folder: 'ledgerpro/qr-codes',
        publicId: order.id,
      });
      return url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `QR upload failed for ${order.orderCode}: ${message}; falling back to client-side rendering`,
      );
      return null;
    }
  }

  async create(
    dto: CreateCustomerOrderDto,
    userId: string,
  ): Promise<CreateCustomerOrderResult> {
    const branch = await this.branches.findEntityById(dto.branchId);
    if (!branch || !branch.isActive) {
      throw new BadRequestException('Branch not found or inactive');
    }

    const user = await this.users.findEntityById(userId);
    if (!user) {
      throw new BadRequestException('Customer not found');
    }

    const itemEntities = await this.buildOrderItems(dto.items);
    const estimatedTotal = this.roundMoney(
      itemEntities.reduce((sum, item) => sum + this.lineAmount(item), 0),
    );
    const paymentMode = dto.paymentMode ?? CustomerOrderPaymentMode.MANUAL;
    const paymentStatus =
      paymentMode === CustomerOrderPaymentMode.ONLINE
        ? CustomerOrderPaymentStatus.PENDING
        : CustomerOrderPaymentStatus.UNPAID;
    const orderCode = await this.generateUniqueCode();

    const saved = await this.orders.createAndSave({
      orderCode,
      userId,
      branchId: dto.branchId,
      status: CustomerOrderStatus.PENDING,
      estimatedTotal,
      loyaltyDiscountAmount: 0,
      finalTotal: estimatedTotal,
      paymentMode,
      paymentStatus,
      loyaltyPointsRedeemed: 0,
      loyaltyPointsEarned: 0,
      guestName: null,
      note: dto.note ?? null,
      items: itemEntities,
    });

    const loyaltyPointsRequested = dto.loyaltyPointsToRedeem ?? 0;
    const loyaltyPointsRedeemed = await this.loyaltyWallet.redeemForOrder({
      owner: { userId },
      orderId: saved.id,
      orderCode: saved.orderCode,
      subtotal: estimatedTotal,
      requestedPoints: loyaltyPointsRequested,
      branchId: dto.branchId,
    });
    const pointValue = await this.loyalty.getPointValue();
    const loyaltyDiscountAmount = this.roundMoney(
      loyaltyPointsRedeemed * pointValue,
    );
    const finalTotal = this.roundMoney(
      Math.max(0, estimatedTotal - loyaltyDiscountAmount),
    );

    if (loyaltyPointsRedeemed > 0 || finalTotal !== estimatedTotal) {
      await this.orders.updateFinancials(saved.id, {
        loyaltyDiscountAmount,
        finalTotal,
        loyaltyPointsRedeemed,
      });
      saved.loyaltyDiscountAmount = loyaltyDiscountAmount;
      saved.finalTotal = finalTotal;
      saved.loyaltyPointsRedeemed = loyaltyPointsRedeemed;
    }

    let payment: PayhereCheckoutPayload | null = null;
    if (paymentMode === CustomerOrderPaymentMode.ONLINE) {
      const providerOrderId = `${saved.orderCode}-${Date.now()}`;
      await this.orders.createPaymentAttempt({
        orderId: saved.id,
        providerOrderId,
        amount: finalTotal,
        currency: CURRENCY,
        status: PayherePaymentAttemptStatus.PENDING,
      });
      payment = this.payhere.createCheckoutPayload(
        {
          orderId: providerOrderId,
          orderCode: saved.orderCode,
          amount: finalTotal,
          currency: CURRENCY,
          itemsLabel: `LedgerPro pickup ${saved.orderCode}`,
        },
        {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
      );
    }

    this.logger.log(
      `Customer order ${saved.orderCode} created at ${branch.name}`,
    );

    const qrCodeUrl = await this.generateAndStoreQrCode(saved);
    if (qrCodeUrl) {
      saved.qrCodeUrl = qrCodeUrl;
      await this.orders.setQrCodeUrl(saved.id, qrCodeUrl);
    }

    this.notifyBranchStaff(saved, branch.name).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Notification fan-out failed: ${message}`);
    });
    // Cashiers now collect directly (no manager approval gate), so they're
    // notified at creation time rather than on a separate accept step.
    this.notifyBranchCashiers(saved, branch.name).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Cashier notification fan-out failed: ${message}`);
    });

    this.realtime.broadcast('customer-order:created', {
      branchId: saved.branchId,
      orderId: saved.id,
      orderCode: saved.orderCode,
    });

    return {
      order: await this.findById(saved.id),
      payment,
    };
  }

  /**
   * Multi-branch checkout: split a cart spanning branches into one order per
   * branch under a shared group code. Loyalty is redeemed once for the group
   * and the discount is distributed across orders proportionally. For ONLINE
   * payment a single PayHere attempt covers the group total; its notify
   * settles every order in the group (see handlePayhereNotify).
   */
  async createCheckout(
    dto: CheckoutCustomerOrderDto,
    userId: string,
    opts: { customerGroupId?: string } = {},
  ): Promise<CreateCheckoutResult> {
    const user = await this.users.findEntityById(userId);
    if (!user) {
      throw new BadRequestException('Customer not found');
    }

    const byBranch = new Map<string, CheckoutCustomerOrderDto['items']>();
    for (const item of dto.items) {
      const list = byBranch.get(item.branchId) ?? [];
      list.push(item);
      byBranch.set(item.branchId, list);
    }

    const paymentMode = dto.paymentMode ?? CustomerOrderPaymentMode.MANUAL;
    const paymentStatus =
      paymentMode === CustomerOrderPaymentMode.ONLINE
        ? CustomerOrderPaymentStatus.PENDING
        : CustomerOrderPaymentStatus.UNPAID;
    const groupCode = this.generateGroupCode();

    const created: {
      order: CustomerOrder;
      branchName: string;
      estimatedTotal: number;
    }[] = [];

    for (const [branchId, items] of byBranch) {
      const branch = await this.branches.findEntityById(branchId);
      if (!branch || !branch.isActive) {
        throw new BadRequestException(
          `Branch ${branchId} not found or inactive`,
        );
      }
      const itemEntities = await this.buildOrderItems(items);
      const estimatedTotal = this.roundMoney(
        itemEntities.reduce((sum, it) => sum + this.lineAmount(it), 0),
      );
      const orderCode = await this.generateUniqueCode();
      const saved = await this.orders.createAndSave({
        orderCode,
        groupCode,
        userId,
        // Stamp the customer group (when this checkout came from a group's
        // shared cart) so the group's analytics can roll the order up. Distinct
        // from groupCode, which only batches this multi-branch checkout.
        customerGroupId: opts.customerGroupId ?? null,
        branchId,
        status: CustomerOrderStatus.PENDING,
        estimatedTotal,
        loyaltyDiscountAmount: 0,
        finalTotal: estimatedTotal,
        paymentMode,
        paymentStatus,
        loyaltyPointsRedeemed: 0,
        loyaltyPointsEarned: 0,
        guestName: null,
        note: dto.note ?? null,
        items: itemEntities,
      });
      created.push({ order: saved, branchName: branch.name, estimatedTotal });
    }

    const groupSubtotal = this.roundMoney(
      created.reduce((sum, c) => sum + c.estimatedTotal, 0),
    );

    // Redeem loyalty once for the group, recorded against the first order.
    const primary = created[0].order;
    const redeemed = await this.loyaltyWallet.redeemForOrder({
      owner: { userId },
      orderId: primary.id,
      orderCode: primary.orderCode,
      subtotal: groupSubtotal,
      requestedPoints: dto.loyaltyPointsToRedeem ?? 0,
      branchId: primary.branchId,
    });
    const pointValue = await this.loyalty.getPointValue();
    const totalDiscount = this.roundMoney(redeemed * pointValue);

    // Distribute the discount across orders proportional to their subtotal.
    let remainingDiscount = totalDiscount;
    for (let i = 0; i < created.length; i++) {
      const c = created[i];
      const isLast = i === created.length - 1;
      const share = isLast
        ? remainingDiscount
        : this.roundMoney(
            groupSubtotal > 0
              ? (totalDiscount * c.estimatedTotal) / groupSubtotal
              : 0,
          );
      remainingDiscount = this.roundMoney(remainingDiscount - share);
      const finalTotal = this.roundMoney(Math.max(0, c.estimatedTotal - share));
      await this.orders.updateFinancials(c.order.id, {
        loyaltyDiscountAmount: share,
        finalTotal,
        loyaltyPointsRedeemed: i === 0 ? redeemed : 0,
      });
    }

    const groupFinalTotal = this.roundMoney(
      Math.max(0, groupSubtotal - totalDiscount),
    );

    // QR per order + branch-staff notifications (best-effort).
    for (const c of created) {
      const url = await this.generateAndStoreQrCode(c.order);
      if (url) {
        await this.orders.setQrCodeUrl(c.order.id, url);
      }
      this.notifyBranchStaff(c.order, c.branchName).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Notification fan-out failed: ${message}`);
      });
      this.notifyBranchCashiers(c.order, c.branchName).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Cashier notification fan-out failed: ${message}`);
      });
      this.realtime.broadcast('customer-order:created', {
        branchId: c.order.branchId,
        orderId: c.order.id,
        orderCode: c.order.orderCode,
      });
    }

    // One PayHere payment for the whole group; its notify settles every order.
    let payment: PayhereCheckoutPayload | null = null;
    if (
      paymentMode === CustomerOrderPaymentMode.ONLINE &&
      groupFinalTotal > 0
    ) {
      const providerOrderId = `${groupCode}-${Date.now()}`;
      await this.orders.createPaymentAttempt({
        orderId: primary.id,
        providerOrderId,
        amount: groupFinalTotal,
        currency: CURRENCY,
        status: PayherePaymentAttemptStatus.PENDING,
      });
      payment = this.payhere.createCheckoutPayload(
        {
          orderId: providerOrderId,
          orderCode: primary.orderCode,
          amount: groupFinalTotal,
          currency: CURRENCY,
          itemsLabel: `LedgerPro pickup ${groupCode}`,
        },
        {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        },
      );
    }

    this.logger.log(
      `Customer checkout ${groupCode} created ${created.length} branch order(s)`,
    );

    return {
      groupCode,
      orders: await this.findGroup(groupCode),
      payment,
    };
  }

  async findGroup(groupCode: string): Promise<CustomerOrder[]> {
    const orders = await this.orders.findByGroupCode(groupCode);
    if (orders.length === 0) {
      throw new NotFoundException('Order group not found');
    }
    return orders;
  }

  async handlePayhereNotify(payload: PayhereNotifyPayload) {
    const providerOrderId = payload.order_id;
    if (!providerOrderId) {
      throw new BadRequestException('Missing PayHere order id');
    }

    const attempt =
      await this.orders.findPaymentAttemptByProviderOrderId(providerOrderId);
    if (!attempt) {
      throw new NotFoundException('Payment attempt not found');
    }

    const signatureValid = this.payhere.verifyNotifySignature(payload);
    const merchantValid = this.payhere.isMerchantValid(payload);
    const amountValid =
      payload.payhere_amount ===
      this.payhere.formatAmount(Number(attempt.amount));
    const currencyValid = payload.payhere_currency === attempt.currency;
    const valid =
      signatureValid && merchantValid && amountValid && currencyValid;
    const statusCode = payload.status_code ?? '';

    if (!valid) {
      await this.orders.updatePaymentAttempt(attempt.id, {
        status: PayherePaymentAttemptStatus.FAILED,
        signatureValid,
        payherePaymentId: payload.payment_id ?? null,
        notifyPayload: this.stringifyPayload(payload),
        failedAt: new Date(),
      });
      this.logger.warn(
        `Rejected PayHere notify for ${providerOrderId}: signature=${signatureValid} merchant=${merchantValid} amount=${amountValid} currency=${currencyValid}`,
      );
      return { accepted: false };
    }

    if (statusCode === '2') {
      await this.handlePaidNotify(attempt.order, attempt.id, payload);
      return { accepted: true };
    }

    if (['-1', '-2', '-3'].includes(statusCode)) {
      const nextStatus =
        statusCode === '-1'
          ? CustomerOrderPaymentStatus.CANCELLED
          : CustomerOrderPaymentStatus.FAILED;
      const attemptStatus =
        statusCode === '-1'
          ? PayherePaymentAttemptStatus.CANCELLED
          : PayherePaymentAttemptStatus.FAILED;

      await this.orders.updatePaymentAttempt(attempt.id, {
        status: attemptStatus,
        signatureValid: true,
        payherePaymentId: payload.payment_id ?? null,
        notifyPayload: this.stringifyPayload(payload),
        failedAt: new Date(),
      });
      await this.cancelUnpaidOnlineOrder(attempt.order, nextStatus);
      return { accepted: true };
    }

    await this.orders.updatePaymentAttempt(attempt.id, {
      status: PayherePaymentAttemptStatus.PENDING,
      signatureValid: true,
      payherePaymentId: payload.payment_id ?? null,
      notifyPayload: this.stringifyPayload(payload),
    });
    return { accepted: true };
  }

  async findByCode(code: string): Promise<CustomerOrder> {
    const order = await this.orders.findByCode(code);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status === CustomerOrderStatus.PENDING) {
      const ageMs = Date.now() - new Date(order.createdAt).getTime();
      if (ageMs > ORDER_TTL_MS) {
        await this.orders.updateStatus(order.id, CustomerOrderStatus.EXPIRED, {
          paymentStatus:
            order.paymentStatus === CustomerOrderPaymentStatus.PAID
              ? order.paymentStatus
              : CustomerOrderPaymentStatus.CANCELLED,
        });
        await this.reverseLoyaltyRedemption(order);
        order.status = CustomerOrderStatus.EXPIRED;
      }
    }
    return order;
  }

  async findById(id: string): Promise<CustomerOrder> {
    const order = await this.orders.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async listForStaff(
    actor: StaffActor,
    query: ListCustomerOrdersQueryDto,
  ): Promise<CustomerOrder[]> {
    if (actor.role !== UserRole.ADMIN && !actor.branchId) {
      this.logger.warn(
        `Staff ${actor.id} (${actor.role}) has no branchId; returning empty list. Assign a branch in user management.`,
      );
      return [];
    }

    const rows = await this.orders.listForStaff({
      actorRole: actor.role,
      actorBranchId: actor.branchId,
      branchId: query.branchId ?? null,
      status: query.status ?? null,
      q: query.q ?? null,
      limit: query.limit ?? 200,
    });
    this.logger.debug(
      `listForStaff actor=${actor.id} role=${actor.role} branchId=${actor.branchId ?? 'ALL'} status=${query.status ?? 'ANY'} q=${query.q ?? '-'} -> ${rows.length} rows`,
    );
    return rows;
  }

  async listForUser(userId: string): Promise<CustomerOrder[]> {
    return this.orders.listForUser(userId);
  }

  async cancelByUser(id: string, userId: string): Promise<CustomerOrder> {
    const order = await this.findById(id);
    if (order.userId !== userId) {
      throw new ForbiddenException('Not your order');
    }
    if (order.status !== CustomerOrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }
    if (order.paymentStatus === CustomerOrderPaymentStatus.PAID) {
      throw new BadRequestException(
        'Paid online orders need a staff-assisted refund',
      );
    }
    await this.orders.updateStatus(id, CustomerOrderStatus.CANCELLED, {
      paymentStatus: CustomerOrderPaymentStatus.CANCELLED,
    });
    await this.reverseLoyaltyRedemption(order);
    return this.findById(id);
  }

  /**
   * Cashier/manager records a no-show: the customer never collected an
   * awaiting pickup order. Allowed only while the order is still awaiting
   * collection (PENDING, or the legacy ACCEPTED). Reverses any loyalty
   * redemption (the discount went unused) and cancels the payment hold for
   * pay-at-pickup orders. Online orders already PAID keep their paid status —
   * a refund, if any, is handled out of band.
   */
  async markNotCollected(
    id: string,
    actor: StaffActor,
  ): Promise<CustomerOrder> {
    const order = await this.findById(id);
    if (actor.role !== UserRole.ADMIN && order.branchId !== actor.branchId) {
      throw new ForbiddenException('Cannot manage orders for another branch');
    }
    if (
      order.status !== CustomerOrderStatus.PENDING &&
      order.status !== CustomerOrderStatus.ACCEPTED
    ) {
      throw new BadRequestException(
        'Only an order awaiting collection can be marked not collected',
      );
    }
    const patch =
      order.paymentStatus === CustomerOrderPaymentStatus.PAID
        ? undefined
        : { paymentStatus: CustomerOrderPaymentStatus.CANCELLED };
    await this.orders.updateStatus(
      id,
      CustomerOrderStatus.NOT_COLLECTED,
      patch,
    );
    await this.reverseLoyaltyRedemption(order);
    return this.findById(id);
  }

  async fulfill(
    code: string,
    dto: FulfillCustomerOrderDto,
    actor: StaffActor,
  ): Promise<{ order: CustomerOrder; transaction: Sale | null }> {
    const order = await this.findByCode(code);
    if (
      order.status !== CustomerOrderStatus.PENDING &&
      order.status !== CustomerOrderStatus.ACCEPTED
    ) {
      throw new ConflictException(
        `Cannot fulfill an order in status "${order.status}"`,
      );
    }
    if (actor.role !== UserRole.ADMIN && order.branchId !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot fulfill an order from another branch',
      );
    }

    if (order.paymentMode === CustomerOrderPaymentMode.ONLINE) {
      if (order.paymentStatus !== CustomerOrderPaymentStatus.PAID) {
        throw new BadRequestException(
          'Online orders must be paid before pickup',
        );
      }
      if (dto.items?.length) {
        throw new BadRequestException('Paid online orders cannot be edited');
      }
      const earned = await this.loyaltyWallet.awardForOrder({
        owner: order.userId ? { userId: order.userId } : null,
        orderId: order.id,
        orderCode: order.orderCode,
        paidAmount: Number(order.finalTotal),
        branchId: order.branchId,
      });
      await this.orders.updateStatus(order.id, CustomerOrderStatus.COMPLETED, {
        loyaltyPointsEarned: earned,
      });
      return {
        order: await this.findById(order.id),
        transaction: null,
      };
    }

    if (!dto.paymentMethod) {
      throw new BadRequestException('Payment method is required');
    }
    if (dto.paymentMethod === PaymentMethod.ONLINE) {
      throw new BadRequestException('Use PayHere checkout for online payments');
    }

    const effective = this.resolveEffectiveItems(order, dto);
    const transaction = await this.createPaidTransactionForOrder({
      order,
      actorId: actor.id,
      paymentMethod: dto.paymentMethod,
      effective,
    });
    const earned = await this.loyaltyWallet.awardForOrder({
      owner: order.userId ? { userId: order.userId } : null,
      orderId: order.id,
      orderCode: order.orderCode,
      paidAmount: Number(transaction.total),
      branchId: order.branchId,
    });

    await this.orders.updateStatus(order.id, CustomerOrderStatus.COMPLETED, {
      fulfilledTransactionId: transaction.id,
      paymentStatus: CustomerOrderPaymentStatus.PAID,
      loyaltyPointsEarned: earned,
    });

    return {
      order: await this.findById(order.id),
      transaction,
    };
  }

  private async handlePaidNotify(
    order: CustomerOrder,
    attemptId: string,
    payload: PayhereNotifyPayload,
  ): Promise<void> {
    // A single PayHere payment can cover a multi-branch group — settle every
    // order under the shared group code. Already-paid orders are skipped, so
    // a duplicate notify is a no-op (idempotent).
    const groupOrders = order.groupCode
      ? await this.orders.findByGroupCode(order.groupCode)
      : [order];

    for (const o of groupOrders) {
      if (o.paymentStatus === CustomerOrderPaymentStatus.PAID) continue;
      const settlementActorId = await this.resolveSettlementActorId(o);
      const transaction = await this.createPaidTransactionForOrder({
        order: o,
        actorId: settlementActorId,
        paymentMethod: PaymentMethod.ONLINE,
        effective: this.orderItems(o),
      });
      await this.orders.updateStatus(o.id, o.status, {
        fulfilledTransactionId: transaction.id,
        paymentStatus: CustomerOrderPaymentStatus.PAID,
      });
    }

    await this.orders.updatePaymentAttempt(attemptId, {
      status: PayherePaymentAttemptStatus.PAID,
      signatureValid: true,
      payherePaymentId: payload.payment_id ?? null,
      notifyPayload: this.stringifyPayload(payload),
      paidAt: new Date(),
    });
  }

  private async cancelUnpaidOnlineOrder(
    order: CustomerOrder,
    paymentStatus: CustomerOrderPaymentStatus,
  ): Promise<void> {
    // Cancel every still-unpaid order in the group when one PayHere payment
    // is cancelled/failed.
    const groupOrders = order.groupCode
      ? await this.orders.findByGroupCode(order.groupCode)
      : [order];
    for (const o of groupOrders) {
      if (o.paymentStatus === CustomerOrderPaymentStatus.PAID) continue;
      await this.orders.updateStatus(o.id, CustomerOrderStatus.CANCELLED, {
        paymentStatus,
      });
      await this.reverseLoyaltyRedemption(o);
    }
  }

  private async buildOrderItems(
    items: {
      productId: string;
      quantity: number;
      unitId?: string | null;
      amount?: number | null;
    }[],
  ) {
    const productIds = items.map((i) => i.productId);
    const products = await this.products.findActiveByIdsWithUnits(productIds);
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('Some products are unavailable');
    }
    const byId = new Map(products.map((p) => [p.id, p]));

    return items.map((it) => {
      const product = byId.get(it.productId);
      if (!product) {
        throw new BadRequestException(`Product ${it.productId} not found`);
      }
      const units = product.sellableUnits ?? [];
      const unit = it.unitId
        ? units.find((u) => u.id === it.unitId)
        : (units.find((u) => u.isBase) ?? null);
      if (it.unitId && !unit) {
        throw new BadRequestException(
          `Unit ${it.unitId} is not valid for product ${it.productId}`,
        );
      }
      const conversion = unit ? Number(unit.conversionToBase) : 1;
      const unitPrice = unit
        ? Number(unit.sellingPrice)
        : Number(product.sellingPrice);
      const baseUnitQty = this.round3(it.quantity * conversion);
      if (product.baseUnit === 'unit' && !Number.isInteger(baseUnitQty)) {
        throw new BadRequestException(
          `${product.name} is sold in whole units; quantity ${baseUnitQty} is not allowed`,
        );
      }

      // "Buy by amount": the customer named a cash figure and we derived the
      // weight. Pin the line to that exact amount — but the server stays the
      // price authority, so the amount must reconcile with quantity × unit
      // price (within the weight-rounding gap) or a client could pay 1 Rs for
      // 1000 kg. Amount selling is loose-only.
      let fixedPriceOverride: number | null = null;
      if (it.amount != null) {
        if (product.baseUnit === 'unit') {
          throw new BadRequestException(
            `${product.name} is sold by the unit and cannot be bought by amount`,
          );
        }
        if (it.amount <= 0) {
          throw new BadRequestException('Amount must be greater than zero');
        }
        const expected = this.roundMoney(unitPrice * it.quantity);
        const tolerance = Math.max(0.01, unitPrice * 0.001);
        if (Math.abs(it.amount - expected) > tolerance) {
          throw new BadRequestException(
            `Amount ${it.amount} does not match ${it.quantity} × ${unitPrice} for ${product.name}`,
          );
        }
        fixedPriceOverride = this.roundMoney(it.amount);
      }

      return this.orders.buildItem({
        productId: product.id,
        quantity: it.quantity,
        unitId: unit ? unit.id : null,
        unitLabel: unit ? unit.name : product.baseUnit,
        baseUnitQty,
        unitPriceSnapshot: unitPrice,
        fixedPriceOverride,
      });
    });
  }

  private resolveEffectiveItems(
    order: CustomerOrder,
    dto: FulfillCustomerOrderDto,
  ): EffectiveOrderItem[] {
    if (dto.items?.length) {
      if (order.loyaltyPointsRedeemed > 0) {
        throw new BadRequestException(
          'Orders with redeemed points cannot be edited at pickup',
        );
      }
      return dto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
    }
    return this.orderItems(order);
  }

  private orderItems(order: CustomerOrder): EffectiveOrderItem[] {
    return order.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      baseUnitQty: Number(item.baseUnitQty) || Number(item.quantity),
      unitPriceSnapshot: Number(item.unitPriceSnapshot),
      fixedPriceOverride:
        item.fixedPriceOverride != null
          ? Number(item.fixedPriceOverride)
          : null,
    }));
  }

  private async createPaidTransactionForOrder(params: {
    order: CustomerOrder;
    actorId: string;
    paymentMethod: PaymentMethod;
    effective: EffectiveOrderItem[];
  }): Promise<Sale> {
    if (params.effective.length === 0) {
      throw new BadRequestException('No items to fulfill');
    }

    const productIds = params.effective.map((i) => i.productId);
    const products = await this.products.findActiveByIds(productIds);
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('Some products are no longer available');
    }
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const txItems = params.effective.map((it) => {
      const product = byId.get(it.productId);
      if (!product) {
        throw new BadRequestException(`Product ${it.productId} not found`);
      }
      // Prefer the order item's snapshot (the chosen unit's price + resolved
      // base-unit qty); fall back to the product base price for pickup-time
      // item overrides which carry no unit context.
      const unitPrice = it.unitPriceSnapshot ?? Number(product.sellingPrice);
      const baseUnitQty = it.baseUnitQty ?? it.quantity;
      const lineTotal = this.roundMoney(
        it.fixedPriceOverride != null
          ? Number(it.fixedPriceOverride)
          : unitPrice * it.quantity,
      );
      subtotal += lineTotal;
      return {
        productId: product.id,
        quantity: it.quantity,
        baseUnitQty,
        unitPrice,
        discountAmount: 0,
        discountType: DiscountType.NONE,
        lineTotal,
      };
    });

    const subtotalRounded = this.roundMoney(subtotal);
    const loyaltyDiscount = Math.min(
      Number(params.order.loyaltyDiscountAmount ?? 0),
      subtotalRounded,
    );
    const total = this.roundMoney(subtotalRounded - loyaltyDiscount);

    const stockResult = await this.inventory.decrementStockBatch(
      params.order.branchId,
      params.effective.map((it) => ({
        productId: it.productId,
        quantity: it.baseUnitQty ?? it.quantity,
      })),
    );
    if (!stockResult.ok) {
      throw new ConflictException('Insufficient stock to fulfill this order');
    }

    const transactionNumber = `TXN-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    const savedTx = await this.pos.createAndSaveTransaction({
      transactionNumber,
      // PHASE-5: replace with InvoiceNumberService.next() once the customer
      // pickup path is folded into the createSale flow. Mirroring the
      // transactionNumber keeps the NOT NULL + UNIQUE sales.invoice_number
      // constraint satisfied for this legacy writer.
      invoiceNumber: transactionNumber,
      branchId: params.order.branchId,
      cashierId: params.actorId,
      type: TransactionType.SALE,
      subtotal: subtotalRounded,
      discountAmount: loyaltyDiscount,
      discountType:
        loyaltyDiscount > 0 ? DiscountType.FIXED : DiscountType.NONE,
      taxAmount: 0,
      total,
      paymentMethod: params.paymentMethod,
      items: txItems,
    });

    if (total > 0) {
      await this.accounting.createLedgerEntry({
        branchId: savedTx.branchId,
        entryType: LedgerEntryType.CREDIT,
        amount: savedTx.total,
        description: `Customer pickup ${params.order.orderCode} - ${savedTx.transactionNumber}`,
        referenceNumber: savedTx.transactionNumber,
        saleId: savedTx.id,
      });
    }

    return savedTx;
  }

  private async resolveSettlementActorId(
    order: CustomerOrder,
  ): Promise<string> {
    const cashier = await this.users.findFirstByBranchAndRole(
      order.branchId,
      UserRole.CASHIER,
    );
    if (cashier) return cashier.id;

    const manager = await this.users.findFirstByBranchAndRole(
      order.branchId,
      UserRole.MANAGER,
    );
    if (manager) return manager.id;

    if (order.userId) {
      this.logger.warn(
        `No branch staff found for online order ${order.orderCode}; using customer id for settlement transaction`,
      );
      return order.userId;
    }

    throw new ConflictException(
      'No branch staff account is available for online settlement',
    );
  }

  private async notifyBranchStaff(
    order: CustomerOrder,
    branchName: string,
  ): Promise<void> {
    const staff = await this.users.findManagersAndAdminsForBranches([
      order.branchId,
    ]);

    const customerName = order.user
      ? `${order.user.firstName} ${order.user.lastName}`
      : (order.guestName ?? 'a customer');
    const title = `New pickup order from ${customerName}`;
    const itemCount = order.items?.length ?? 0;
    const message = `Pickup order at ${branchName}. Code ${order.orderCode}, ${itemCount} item${itemCount === 1 ? '' : 's'}.`;

    await Promise.all(
      staff.map((s) =>
        this.notifications.create({
          userId: s.id,
          title,
          message,
          type: NotificationType.CUSTOMER_ORDER,
          metadata: {
            orderId: order.id,
            orderCode: order.orderCode,
            branchId: order.branchId,
          },
        }),
      ),
    );
  }

  private async notifyBranchCashiers(
    order: CustomerOrder,
    branchName: string,
  ): Promise<void> {
    const cashiers = await this.users.findByBranchAndRole(
      order.branchId,
      UserRole.CASHIER,
    );
    if (cashiers.length === 0) return;

    const customerName = order.user
      ? `${order.user.firstName} ${order.user.lastName}`
      : (order.guestName ?? 'a customer');
    const itemCount = order.items?.length ?? 0;
    const title = 'New pickup order to fulfill';
    const message = `${branchName}: ${customerName}'s pickup. Code ${order.orderCode}, ${itemCount} item${itemCount === 1 ? '' : 's'}.`;

    await Promise.all(
      cashiers.map((c) =>
        this.notifications.create({
          userId: c.id,
          title,
          message,
          type: NotificationType.CUSTOMER_ORDER,
          metadata: {
            orderId: order.id,
            orderCode: order.orderCode,
            branchId: order.branchId,
          },
        }),
      ),
    );
  }

  private async reverseLoyaltyRedemption(order: CustomerOrder): Promise<void> {
    if (!order.userId || order.loyaltyPointsRedeemed <= 0) return;
    await this.loyaltyWallet.reverseRedemption({
      owner: { userId: order.userId },
      orderId: order.id,
      orderCode: order.orderCode,
      branchId: order.branchId,
    });
  }

  private stringifyPayload(
    payload: PayhereNotifyPayload,
  ): Record<string, string> {
    return Object.entries(payload).reduce<Record<string, string>>(
      (acc, [key, value]) => {
        if (value !== undefined) acc[key] = String(value);
        return acc;
      },
      {},
    );
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Raw line value before the order-level round: a "buy by amount" loose line
   * is charged its fixed override, every other line is unit price × quantity.
   */
  private lineAmount(item: {
    fixedPriceOverride?: number | null;
    unitPriceSnapshot?: number | null;
    quantity: number;
  }): number {
    if (item.fixedPriceOverride != null) {
      return Number(item.fixedPriceOverride);
    }
    return Number(item.unitPriceSnapshot ?? 0) * Number(item.quantity);
  }

  private round3(value: number): number {
    return Math.round(value * 1000) / 1000;
  }

  private generateGroupCode(): string {
    const bytes = crypto.randomBytes(8);
    let code = 'GRP-';
    for (let i = 0; i < 8; i++) {
      code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
    }
    return code;
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const bytes = crypto.randomBytes(8);
      let code = 'ORD-';
      for (let i = 0; i < 8; i++) {
        code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
      }
      const exists = await this.orders.existsByCode(code);
      if (!exists) return code;
    }
    throw new InternalServerErrorException(
      'Failed to generate unique order code',
    );
  }
}
