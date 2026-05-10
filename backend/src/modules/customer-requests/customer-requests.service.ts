import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { CustomerRequest } from '@/modules/customer-requests/entities/customer-request.entity';
import { CustomerRequestItem } from '@/modules/customer-requests/entities/customer-request-item.entity';
import { CreateCustomerRequestDto } from '@/modules/customer-requests/dto/create-customer-request.dto';
import { FulfillCustomerRequestDto } from '@/modules/customer-requests/dto/fulfill-customer-request.dto';
import { ListCustomerRequestsQueryDto } from '@/modules/customer-requests/dto/list-customer-requests-query.dto';
import { Product } from '@products/entities/product.entity';
import { Branch } from '@branches/entities/branch.entity';
import { User } from '@users/entities/user.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
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
    @InjectRepository(CustomerRequest)
    private readonly requestRepo: Repository<CustomerRequest>,
    @InjectRepository(CustomerRequestItem)
    private readonly requestItemRepo: Repository<CustomerRequestItem>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Branch)
    private readonly branchRepo: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepo: Repository<LedgerEntry>,
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
    const branch = await this.branchRepo.findOne({
      where: { id: dto.branchId, isActive: true },
    });
    if (!branch) {
      throw new BadRequestException('Branch not found or inactive');
    }

    const productIds = dto.items.map((i) => i.productId);
    const products = await this.productRepo.find({
      where: { id: In(productIds), isActive: true },
    });
    if (products.length !== new Set(productIds).size) {
      throw new BadRequestException('Some products are unavailable');
    }
    const byId = new Map(products.map((p) => [p.id, p]));

    let estimatedTotal = 0;
    const itemEntities: CustomerRequestItem[] = dto.items.map((it) => {
      const product = byId.get(it.productId);
      if (!product) {
        throw new BadRequestException(`Product ${it.productId} not found`);
      }
      const unitPriceSnapshot = Number(product.sellingPrice);
      estimatedTotal += unitPriceSnapshot * it.quantity;
      return this.requestItemRepo.create({
        productId: product.id,
        quantity: it.quantity,
        unitPriceSnapshot,
      });
    });

    const requestCode = await this.generateUniqueCode();

    const request = this.requestRepo.create({
      requestCode,
      userId,
      branchId: dto.branchId,
      status: CustomerRequestStatus.PENDING,
      estimatedTotal: Math.round(estimatedTotal * 100) / 100,
      guestName: null,
      note: dto.note ?? null,
      items: itemEntities,
    });

    const saved = await this.requestRepo.save(request);
    this.logger.log(
      `Customer request ${saved.requestCode} created at ${branch.name}`,
    );

    const qrCodeUrl = await this.generateAndStoreQrCode(saved);
    if (qrCodeUrl) {
      saved.qrCodeUrl = qrCodeUrl;
      await this.requestRepo.update(saved.id, { qrCodeUrl });
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
    const req = await this.requestRepo.findOne({
      where: { requestCode: code },
      relations: ['items', 'items.product', 'branch', 'user'],
    });
    if (!req) {
      throw new NotFoundException('Request not found');
    }
    if (req.status === CustomerRequestStatus.PENDING) {
      const ageMs = Date.now() - new Date(req.createdAt).getTime();
      if (ageMs > REQUEST_TTL_MS) {
        await this.requestRepo.update(req.id, {
          status: CustomerRequestStatus.EXPIRED,
        });
        req.status = CustomerRequestStatus.EXPIRED;
      }
    }
    return req;
  }

  async findById(id: string): Promise<CustomerRequest> {
    const req = await this.requestRepo.findOne({
      where: { id },
      relations: ['items', 'items.product', 'branch', 'user'],
    });
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
    // and looks like "no requests yet" in the UI.  Surface the data problem
    // instead of hiding it.
    if (actor.role !== UserRole.ADMIN && !actor.branchId) {
      this.logger.warn(
        `Staff ${actor.id} (${actor.role}) has no branchId — returning empty list. Assign a branch in user management.`,
      );
      return [];
    }

    const qb = this.requestRepo
      .createQueryBuilder('req')
      .leftJoinAndSelect('req.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('req.branch', 'branch')
      .leftJoinAndSelect('req.user', 'user')
      .orderBy('req.createdAt', 'DESC')
      .take(query.limit ?? 200);

    if (actor.role !== UserRole.ADMIN) {
      qb.andWhere('req.branch_id = :branchId', { branchId: actor.branchId });
    } else if (query.branchId) {
      qb.andWhere('req.branch_id = :branchId', { branchId: query.branchId });
    }

    if (query.status) {
      qb.andWhere('req.status = :status', { status: query.status });
    } else if (actor.role === UserRole.CASHIER) {
      // Cashiers don't need rejected/cancelled/expired noise — they can only
      // act on pending and accepted (and want to see today's completed).
      qb.andWhere('req.status IN (:...visibleToCashier)', {
        visibleToCashier: [
          CustomerRequestStatus.PENDING,
          CustomerRequestStatus.ACCEPTED,
          CustomerRequestStatus.COMPLETED,
        ],
      });
    }

    if (query.q) {
      qb.andWhere(
        "(LOWER(req.request_code) LIKE LOWER(:q) OR LOWER(COALESCE(req.guest_name, '')) LIKE LOWER(:q))",
        { q: `%${query.q}%` },
      );
    }

    const rows = await qb.getMany();
    this.logger.debug(
      `listForStaff actor=${actor.id} role=${actor.role} branchId=${actor.branchId ?? 'ALL'} status=${query.status ?? 'ANY'} q=${query.q ?? '-'} → ${rows.length} rows`,
    );
    return rows;
  }

  async listForUser(userId: string): Promise<CustomerRequest[]> {
    return this.requestRepo.find({
      where: { userId },
      relations: ['items', 'items.product', 'branch'],
      order: { createdAt: 'DESC' },
    });
  }

  async cancelByUser(id: string, userId: string): Promise<CustomerRequest> {
    const req = await this.findById(id);
    if (req.userId !== userId) {
      throw new ForbiddenException('Not your request');
    }
    if (req.status !== CustomerRequestStatus.PENDING) {
      throw new BadRequestException('Only pending requests can be cancelled');
    }
    await this.requestRepo.update(id, {
      status: CustomerRequestStatus.CANCELLED,
    });
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
    await this.requestRepo.update(id, {
      status: CustomerRequestStatus.ACCEPTED,
    });
    const updated = await this.findById(id);

    const branch = await this.branchRepo.findOne({
      where: { id: updated.branchId },
    });
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
    await this.requestRepo.update(id, {
      status: CustomerRequestStatus.REJECTED,
    });
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
    const products = await this.productRepo.find({
      where: { id: In(productIds), isActive: true },
    });
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

    const transaction = this.transactionRepo.create({
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
    const savedTx = await this.transactionRepo.save(transaction);

    if (total > 0) {
      const ledgerEntry = this.ledgerRepo.create({
        branchId: savedTx.branchId,
        entryType: LedgerEntryType.CREDIT,
        amount: savedTx.total,
        description: `Customer Pickup — ${req.requestCode} — ${savedTx.transactionNumber}`,
        referenceNumber: savedTx.transactionNumber,
        transactionId: savedTx.id,
      });
      await this.ledgerRepo.save(ledgerEntry);
    }

    await this.requestRepo.update(req.id, {
      status: CustomerRequestStatus.COMPLETED,
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
    const staff = await this.userRepo.find({
      where: [
        { branchId: request.branchId, role: UserRole.MANAGER },
        { branchId: request.branchId, role: UserRole.ADMIN },
      ],
    });

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
    const cashiers = await this.userRepo.find({
      where: { branchId: request.branchId, role: UserRole.CASHIER },
    });
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
      const exists = await this.requestRepo.findOne({
        where: { requestCode: code },
      });
      if (!exists) return code;
    }
    throw new InternalServerErrorException(
      'Failed to generate unique request code',
    );
  }
}
