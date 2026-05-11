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
import { CustomerRequest } from '@/modules/customer-requests/entities/customer-request.entity';
import { CustomerRequestsRepository } from '@/modules/customer-requests/customer-requests.repository';
import { CreateCustomerRequestDto } from '@/modules/customer-requests/dto/create-customer-request.dto';
import { FulfillCustomerRequestDto } from '@/modules/customer-requests/dto/fulfill-customer-request.dto';
import { ListCustomerRequestsQueryDto } from '@/modules/customer-requests/dto/list-customer-requests-query.dto';
import { ProductsRepository } from '@products/products.repository';
import { BranchesRepository } from '@branches/branches.repository';
import { UsersRepository } from '@users/users.repository';
import { PosRepository } from '@pos/pos.repository';
import { AccountingRepository } from '@accounting/accounting.repository';
import { Transaction } from '@pos/entities/transaction.entity';
import { CustomerRequestStatus } from '@common/enums/customer-request.enum';
import { TransactionType } from '@common/enums/transaction.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { NotificationType } from '@common/enums/notification.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import { NotificationsService } from '@notifications/notifications.service';
import { NotificationsGateway } from '@notifications/notifications.gateway';

const REQUEST_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

interface StaffActor {
  id: string;
  role: UserRole;
  branchId: string | null;
}

@Injectable()
export class CustomerRequestsService {
  private readonly logger = new Logger(CustomerRequestsService.name);

  constructor(
    private readonly requests: CustomerRequestsRepository,
    private readonly products: ProductsRepository,
    private readonly branches: BranchesRepository,
    private readonly users: UsersRepository,
    private readonly pos: PosRepository,
    private readonly accounting: AccountingRepository,
    private readonly notifications: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly cloudinary: CloudinaryService,
  ) {}

  private async generateAndStoreQrCode(
    request: CustomerRequest,
  ): Promise<string | null> {
    try {
      const buffer = await QRCode.toBuffer(request.requestCode, {
        width: 512,
        margin: 1,
        errorCorrectionLevel: 'M',
      });
      const { url } = await this.cloudinary.uploadBuffer(buffer, {
        folder: 'ledgerpro/qr-codes',
        publicId: request.id,
      });
      return url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `QR upload failed for ${request.requestCode}: ${message} — falling back to client-side rendering`,
      );
      return null;
    }
  }

  async create(
    dto: CreateCustomerRequestDto,
    userId: string,
  ): Promise<CustomerRequest> {
    const branch = await this.branches.findById(dto.branchId);
    if (!branch || !branch.isActive) {
      throw new BadRequestException('Branch not found or inactive');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.products.findActiveByIds(productIds);
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('Some products are unavailable');
    }
    const byId = new Map(products.map((p) => [p.id, p]));

    let estimatedTotal = 0;
    const itemEntities = dto.items.map((it) => {
      const product = byId.get(it.productId);
      if (!product) {
        throw new BadRequestException(`Product ${it.productId} not found`);
      }
      const unitPriceSnapshot = Number(product.sellingPrice);
      estimatedTotal += unitPriceSnapshot * it.quantity;
      return this.requests.buildItem({
        productId: product.id,
        quantity: it.quantity,
        unitPriceSnapshot,
      });
    });

    const requestCode = await this.generateUniqueCode();

    const saved = await this.requests.createAndSave({
      requestCode,
      userId,
      branchId: dto.branchId,
      status: CustomerRequestStatus.PENDING,
      estimatedTotal: Math.round(estimatedTotal * 100) / 100,
      guestName: null,
      note: dto.note ?? null,
      items: itemEntities,
    });
    this.logger.log(
      `Customer request ${saved.requestCode} created at ${branch.name}`,
    );

    const qrCodeUrl = await this.generateAndStoreQrCode(saved);
    if (qrCodeUrl) {
      saved.qrCodeUrl = qrCodeUrl;
      await this.requests.setQrCodeUrl(saved.id, qrCodeUrl);
    }

    this.notifyBranchStaff(saved, branch.name).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Notification fan-out failed: ${message}`);
    });

    // Live broadcast so manager / cashier dashboards refetch immediately
    // instead of waiting for the 30-second poll.
    this.notificationsGateway.broadcast('customer-request:created', {
      branchId: saved.branchId,
      requestId: saved.id,
      requestCode: saved.requestCode,
    });

    return this.findById(saved.id);
  }

  async findByCode(code: string): Promise<CustomerRequest> {
    const req = await this.requests.findByCode(code);
    if (!req) {
      throw new NotFoundException('Request not found');
    }
    if (req.status === CustomerRequestStatus.PENDING) {
      const ageMs = Date.now() - new Date(req.createdAt).getTime();
      if (ageMs > REQUEST_TTL_MS) {
        await this.requests.updateStatus(req.id, CustomerRequestStatus.EXPIRED);
        req.status = CustomerRequestStatus.EXPIRED;
      }
    }
    return req;
  }

  async findById(id: string): Promise<CustomerRequest> {
    const req = await this.requests.findById(id);
    if (!req) {
      throw new NotFoundException('Request not found');
    }
    return req;
  }

  async listForStaff(
    actor: StaffActor,
    query: ListCustomerRequestsQueryDto,
  ): Promise<CustomerRequest[]> {
    // Defensive: a manager/cashier without a branch assignment would otherwise
    // produce SQL like `branch_id = NULL` which silently returns zero rows
    // and looks like "no requests yet" in the UI. Surface the data problem
    // instead of hiding it.
    if (actor.role !== UserRole.ADMIN && !actor.branchId) {
      this.logger.warn(
        `Staff ${actor.id} (${actor.role}) has no branchId — returning empty list. Assign a branch in user management.`,
      );
      return [];
    }

    const rows = await this.requests.listForStaff({
      actorRole: actor.role,
      actorBranchId: actor.branchId,
      branchId: query.branchId ?? null,
      status: query.status ?? null,
      q: query.q ?? null,
      limit: query.limit ?? 200,
    });
    this.logger.debug(
      `listForStaff actor=${actor.id} role=${actor.role} branchId=${actor.branchId ?? 'ALL'} status=${query.status ?? 'ANY'} q=${query.q ?? '-'} → ${rows.length} rows`,
    );
    return rows;
  }

  async listForUser(userId: string): Promise<CustomerRequest[]> {
    return this.requests.listForUser(userId);
  }

  async cancelByUser(id: string, userId: string): Promise<CustomerRequest> {
    const req = await this.findById(id);
    if (req.userId !== userId) {
      throw new ForbiddenException('Not your request');
    }
    if (req.status !== CustomerRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }
    await this.requests.updateStatus(id, CustomerRequestStatus.CANCELLED);
    return this.findById(id);
  }

  async acceptByStaff(id: string, actor: StaffActor): Promise<CustomerRequest> {
    const req = await this.findById(id);
    if (actor.role !== UserRole.ADMIN && req.branchId !== actor.branchId) {
      throw new ForbiddenException('Cannot manage requests for another branch');
    }
    if (req.status !== CustomerRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be accepted');
    }
    await this.requests.updateStatus(id, CustomerRequestStatus.ACCEPTED);
    const updated = await this.findById(id);

    const branch = await this.branches.findById(updated.branchId);
    if (branch) {
      this.notifyBranchCashiers(updated, branch.name).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(`Cashier notification fan-out failed: ${message}`);
      });
    }

    return updated;
  }

  async rejectByStaff(id: string, actor: StaffActor): Promise<CustomerRequest> {
    const req = await this.findById(id);
    if (actor.role !== UserRole.ADMIN && req.branchId !== actor.branchId) {
      throw new ForbiddenException('Cannot manage requests for another branch');
    }
    if (req.status !== CustomerRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be rejected');
    }
    await this.requests.updateStatus(id, CustomerRequestStatus.REJECTED);
    return this.findById(id);
  }

  async fulfill(
    code: string,
    dto: FulfillCustomerRequestDto,
    actor: StaffActor,
  ): Promise<{ request: CustomerRequest; transaction: Transaction }> {
    const req = await this.findByCode(code);
    if (
      req.status !== CustomerRequestStatus.PENDING &&
      req.status !== CustomerRequestStatus.ACCEPTED
    ) {
      throw new ConflictException(
        `Cannot fulfill a request in status "${req.status}"`,
      );
    }
    if (actor.role !== UserRole.ADMIN && req.branchId !== actor.branchId) {
      throw new ForbiddenException(
        'Cannot fulfill a request from another branch',
      );
    }

    const effective =
      dto.items ??
      req.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }));
    if (effective.length === 0) {
      throw new BadRequestException('No items to fulfill');
    }

    const productIds = effective.map((i) => i.productId);
    const products = await this.products.findActiveByIds(productIds);
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('Some products are no longer available');
    }
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const txItems = effective.map((it) => {
      const product = byId.get(it.productId);
      if (!product) {
        throw new BadRequestException(`Product ${it.productId} not found`);
      }
      const unitPrice = Number(product.sellingPrice);
      const lineTotal = unitPrice * it.quantity;
      subtotal += lineTotal;
      return {
        productId: product.id,
        quantity: it.quantity,
        unitPrice,
        discountAmount: 0,
        discountType: DiscountType.NONE,
        lineTotal: Math.round(lineTotal * 100) / 100,
      };
    });
    const total = Math.round(subtotal * 100) / 100;
    const subtotalRounded = total;

    const transactionNumber = `TXN-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase()}`;

    const savedTx = await this.pos.createAndSaveTransaction({
      transactionNumber,
      branchId: req.branchId,
      cashierId: actor.id,
      type: TransactionType.SALE,
      subtotal: subtotalRounded,
      discountAmount: 0,
      discountType: DiscountType.NONE,
      taxAmount: 0,
      total,
      paymentMethod: dto.paymentMethod,
      items: txItems,
    });

    if (total > 0) {
      await this.accounting.createLedgerEntry({
        branchId: savedTx.branchId,
        entryType: LedgerEntryType.CREDIT,
        amount: savedTx.total,
        description: `Customer Pickup — ${req.requestCode} — ${savedTx.transactionNumber}`,
        referenceNumber: savedTx.transactionNumber,
        transactionId: savedTx.id,
      });
    }

    await this.requests.updateStatus(req.id, CustomerRequestStatus.COMPLETED, {
      fulfilledTransactionId: savedTx.id,
    });

    return {
      request: await this.findById(req.id),
      transaction: savedTx,
    };
  }

  private async notifyBranchStaff(
    request: CustomerRequest,
    branchName: string,
  ): Promise<void> {
    const staff = await this.users.findManagersAndAdminsForBranches([
      request.branchId,
    ]);

    const customerName = request.user
      ? `${request.user.firstName} ${request.user.lastName}`
      : (request.guestName ?? 'a customer');
    const title = `New pickup request from ${customerName}`;
    const itemCount = request.items?.length ?? 0;
    const message = `Pickup request at ${branchName}. Code ${request.requestCode}, ${itemCount} item${itemCount === 1 ? '' : 's'}.`;

    await Promise.all(
      staff.map((s) =>
        this.notifications.create({
          userId: s.id,
          title,
          message,
          type: NotificationType.CUSTOMER_REQUEST,
          metadata: {
            requestId: request.id,
            requestCode: request.requestCode,
            branchId: request.branchId,
          },
        }),
      ),
    );
  }

  private async notifyBranchCashiers(
    request: CustomerRequest,
    branchName: string,
  ): Promise<void> {
    const cashiers = await this.users.findByBranchAndRole(
      request.branchId,
      UserRole.CASHIER,
    );
    if (cashiers.length === 0) return;

    const customerName = request.user
      ? `${request.user.firstName} ${request.user.lastName}`
      : (request.guestName ?? 'a customer');
    const itemCount = request.items?.length ?? 0;
    const title = 'Pickup ready to fulfill';
    const message = `${branchName} accepted ${customerName}'s pickup. Code ${request.requestCode}, ${itemCount} item${itemCount === 1 ? '' : 's'}.`;

    await Promise.all(
      cashiers.map((c) =>
        this.notifications.create({
          userId: c.id,
          title,
          message,
          type: NotificationType.CUSTOMER_REQUEST,
          metadata: {
            requestId: request.id,
            requestCode: request.requestCode,
            branchId: request.branchId,
          },
        }),
      ),
    );
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const bytes = crypto.randomBytes(8);
      let code = 'REQ-';
      for (let i = 0; i < 8; i++) {
        code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
      }
      const exists = await this.requests.existsByCode(code);
      if (!exists) return code;
    }
    throw new InternalServerErrorException(
      'Failed to generate unique request code',
    );
  }
}
