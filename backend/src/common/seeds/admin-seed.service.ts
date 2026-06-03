import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { defaultSellableUnitsFor } from '@products/lib/default-sellable-units';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { LedgerEntry } from '@accounting/entities/ledger-entry.entity';
import { Expense } from '@accounting/entities/expense.entity';
import { UserRole } from '@common/enums/user-roles.enums';
import { TransactionType } from '@common/enums/transaction.enum';
import { DiscountType } from '@common/enums/discount.enum';
import { PaymentMethod } from '@common/enums/payment-method';
import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { Notification } from '@notifications/entities/notification.entity';
import { NotificationType } from '@common/enums/notification.enum';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { TransferStatus } from '@common/enums/transfer-status.enum';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { pickSeedImageUrl } from '@common/seeds/seed-product-images';
import { HrSeedService } from '@common/seeds/hr-seed.service';
import {
  CATEGORY_THRESHOLDS,
  SUPERMARKET_PRODUCTS,
} from '@common/seeds/supermarket-products.seed';
import {
  buildSeedSaleLine,
  generateSeedQuantity,
} from '@common/seeds/seed-quantity';

interface SeedDefaults {
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
}

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductSellableUnit)
    private readonly sellableUnitRepository: Repository<ProductSellableUnit>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Sale)
    private readonly transactionRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly transactionItemRepository: Repository<SaleItem>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepository: Repository<LedgerEntry>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(StockTransferRequest)
    private readonly stockTransferRepository: Repository<StockTransferRequest>,
    private readonly configService: ConfigService,
    private readonly cloudinary: CloudinaryService,
    private readonly hrSeed: HrSeedService,
  ) {}

  onModuleInit(): void {
    // Run the seed in the background so Cloudinary or any slow step never
    // blocks Nest from calling app.listen(). The critical rows (branches +
    // users) finish in seconds, well before a real login attempt arrives;
    // image uploads and transaction history can finish at their own pace.
    void this.seed().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Background seed failed: ${message}`);
    });
  }

  async seed(): Promise<void> {
    this.logger.log('Running supermarket seed...');
    const defaults = this.getSeedDefaults();

    // 1. Branches — three so the inter-branch transfer flow can be demoed end-to-end.
    const mainBranch = await this.ensureBranch(
      'BR001',
      defaults.branchName,
      defaults.branchAddress,
      defaults.branchPhone,
    );
    const downtownBranch = await this.ensureBranch(
      'BR002',
      'Downtown Branch',
      '45 Commerce Street, Downtown',
      '+94112345678',
    );
    const suburbanBranch = await this.ensureBranch(
      'BR003',
      'Suburban Branch',
      '88 Garden Avenue, Suburb',
      '+94112987654',
    );

    // 2. Users — admins (not tied to any branch), branch managers, cashiers
    const admin = await this.ensureUser({
      email: defaults.adminEmail,
      password: defaults.adminPassword,
      firstName: defaults.adminFirstName,
      lastName: defaults.adminLastName,
      role: UserRole.ADMIN,
      branchId: null,
    });

    await this.ensureUser({
      email: 'admin2@ledgerpro.com',
      password: 'Admin@123',
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      branchId: null,
    });

    const mainManager = await this.ensureUser({
      email: 'manager.main@ledgerpro.com',
      password: 'Manager@123',
      firstName: 'John',
      lastName: 'Smith',
      role: UserRole.MANAGER,
      branchId: mainBranch.id,
    });

    const downtownManager = await this.ensureUser({
      email: 'manager@ledgerpro.com',
      password: 'Manager@123',
      firstName: 'Sarah',
      lastName: 'Connor',
      role: UserRole.MANAGER,
      branchId: downtownBranch.id,
    });

    const suburbanManager = await this.ensureUser({
      email: 'manager.suburban@ledgerpro.com',
      password: 'Manager@123',
      firstName: 'Mary',
      lastName: 'Jones',
      role: UserRole.MANAGER,
      branchId: suburbanBranch.id,
    });

    const cashier1 = await this.ensureUser({
      email: 'cashier@ledgerpro.com',
      password: 'Cashier@123',
      firstName: 'Emma',
      lastName: 'Frost',
      role: UserRole.CASHIER,
      branchId: mainBranch.id,
    });

    const cashier2 = await this.ensureUser({
      email: 'cashier2@ledgerpro.com',
      password: 'Cashier@123',
      firstName: 'James',
      lastName: 'Logan',
      role: UserRole.CASHIER,
      branchId: downtownBranch.id,
    });

    const cashier3 = await this.ensureUser({
      email: 'cashier3@ledgerpro.com',
      password: 'Cashier@123',
      firstName: 'Liam',
      lastName: 'Park',
      role: UserRole.CASHIER,
      branchId: suburbanBranch.id,
    });

    // 3. Products — supermarket catalogue (idempotent by barcode)
    const products = await this.ensureProducts();

    // 4. Inventory — vary distribution per branch so low-stock and out-of-stock
    //    states exist naturally for testing the transfer feature.
    await this.ensureInventory(products, mainBranch.id, 'healthy');
    await this.ensureInventory(products, downtownBranch.id, 'healthy');
    await this.ensureInventory(products, suburbanBranch.id, 'short');

    // 5. Transactions — last 7 days of POS sales
    await this.ensureTransactions(cashier1, mainBranch.id, products);
    await this.ensureTransactions(cashier2, downtownBranch.id, products);

    // 6. Ledger entries & expenses — supermarket-themed
    await this.ensureLedgerAndExpenses(
      mainBranch.id,
      downtownBranch.id,
      suburbanBranch.id,
      admin.id,
    );

    // 7. Notifications
    await this.ensureNotifications([admin, cashier1, cashier2]);

    // 8. Stock transfer requests — five sample requests across all states so
    //    every status pill is visible the first time you log in.
    await this.ensureStockTransfers({
      mainBranch,
      downtownBranch,
      suburbanBranch,
      admin,
      mainManager,
      downtownManager,
      suburbanManager,
      products,
    });

    // 9. HR demo seed — employees, salary structures, attendance,
    //    leaves, and a previous-month payroll run.
    await this.hrSeed.seed({
      admin,
      mainBranch,
      downtownBranch,
      suburbanBranch,
      mainManager,
      downtownManager,
      suburbanManager,
      cashier1,
      cashier2,
      cashier3,
    });

    this.logger.log('Supermarket seed completed.');
  }

  // ── Branch ─────────────────────────────────────────────

  private async ensureBranch(
    code: string,
    name: string,
    addressLine1: string,
    phone: string,
  ): Promise<Branch> {
    let branch = await this.branchRepository.findOne({ where: { name } });
    if (!branch) {
      branch = await this.branchRepository.save(
        this.branchRepository.create({
          code,
          name,
          addressLine1,
          phone,
          isActive: true,
        }),
      );
      this.logger.log(`Branch "${name}" (${code}) created.`);
    }
    return branch;
  }

  // ── User ───────────────────────────────────────────────

  private async ensureUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    branchId: string | null;
  }): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (user) {
      const patch: Partial<User> = {};
      if (user.isFirstLogin) {
        patch.isFirstLogin = false;
        user.isFirstLogin = false;
      }
      // Heal stale branchId for seed-managed accounts. Admins should always
      // have branchId === null (they oversee all branches); managers and
      // cashiers should stay pinned to their seeded branch.
      if ((user.branchId ?? null) !== data.branchId) {
        patch.branchId = data.branchId;
        user.branchId = data.branchId;
      }
      if (Object.keys(patch).length > 0) {
        await this.userRepository.update(user.id, patch);
      }
      return user;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    user = await this.userRepository.save(
      this.userRepository.create({
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        branchId: data.branchId,
        isFirstLogin: false,
        isVerified: true,
      }),
    );
    this.logger.log(`User "${data.email}" (${data.role}) created.`);
    return user;
  }

  // ── Products ───────────────────────────────────────────

  private async ensureProducts(): Promise<Product[]> {
    const products: Product[] = [];
    let createdCount = 0;

    // Round-robin index per category for deterministic image assignment.
    const indexInCategory = new Map<string, number>();

    let imagesUploaded = 0;
    let imagesKept = 0;
    let imagesFailed = 0;
    const cloudinaryEnabled = this.cloudinary.isEnabled();

    for (const p of SUPERMARKET_PRODUCTS) {
      const idx = indexInCategory.get(p.category) ?? 0;
      indexInCategory.set(p.category, idx + 1);

      let product = await this.productRepository.findOne({
        where: { barcode: p.barcode },
      });
      if (!product) {
        product = await this.productRepository.save(
          this.productRepository.create({ ...p, isActive: true }),
        );
        createdCount++;
      } else {
        const patch: Partial<Product> = {};
        if (product.name !== p.name) {
          patch.name = p.name;
          product.name = p.name;
        }
        if (product.category !== p.category) {
          patch.category = p.category;
          product.category = p.category;
        }
        if (product.description !== p.description) {
          patch.description = p.description;
          product.description = p.description;
        }
        if (product.baseUnit !== p.baseUnit) {
          patch.baseUnit = p.baseUnit;
          product.baseUnit = p.baseUnit;
        }
        if (Number(product.costPrice) !== p.costPrice) {
          patch.costPrice = p.costPrice;
          product.costPrice = p.costPrice;
        }
        if (Number(product.sellingPrice) !== p.sellingPrice) {
          patch.sellingPrice = p.sellingPrice;
          product.sellingPrice = p.sellingPrice;
        }
        if (!product.isActive) {
          patch.isActive = true;
          product.isActive = true;
        }
        if (Object.keys(patch).length > 0) {
          product = await this.productRepository.save(product);
        }
      }

      // Idempotent sellable-units sync. Always replace so re-running the
      // seed after a baseUnit change converges product_sellable_units to
      // the defaultSellableUnitsFor(baseUnit) shape.
      // The Phase A1 migration only backfilled rows missing units; this
      // keeps existing rows in lockstep with the seed source.
      const unitSeeds = defaultSellableUnitsFor(
        product.id,
        product.baseUnit,
        Number(product.sellingPrice),
      );
      await this.sellableUnitRepository.delete({ productId: product.id });
      await this.sellableUnitRepository.save(
        unitSeeds.map((s) => this.sellableUnitRepository.create(s)),
      );

      // Resolve the desired image URL for this product.
      const sourceUrl = pickSeedImageUrl(p.category, idx);
      if (!sourceUrl) {
        products.push(product);
        continue;
      }

      const expectedPublicIdFragment = `ledgerpro/products/${product.id}`;
      const alreadyMigrated =
        cloudinaryEnabled &&
        product.imageUrl?.startsWith('https://res.cloudinary.com/') &&
        product.imageUrl.includes(expectedPublicIdFragment);

      if (alreadyMigrated) {
        imagesKept++;
        products.push(product);
        continue;
      }

      let resolvedImageUrl: string | null = null;
      if (cloudinaryEnabled) {
        try {
          const { url } = await this.uploadWithTimeout(sourceUrl, product.id);
          resolvedImageUrl = url;
          imagesUploaded++;
        } catch (err) {
          imagesFailed++;
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(
            `Seed image upload failed for "${p.name}" (${sourceUrl}): ${message}`,
          );
          // Fall back to the raw Unsplash URL so the storefront still has something.
          resolvedImageUrl = sourceUrl;
        }
      } else {
        resolvedImageUrl = sourceUrl;
      }

      if (resolvedImageUrl && resolvedImageUrl !== product.imageUrl) {
        await this.productRepository.update(product.id, {
          imageUrl: resolvedImageUrl,
        });
        product.imageUrl = resolvedImageUrl;
      }

      products.push(product);
    }

    if (createdCount > 0) {
      this.logger.log(`${createdCount} supermarket products created.`);
    }
    if (cloudinaryEnabled) {
      this.logger.log(
        `Seed images via Cloudinary — uploaded: ${imagesUploaded}, kept: ${imagesKept}, failed: ${imagesFailed}.`,
      );
    } else {
      this.logger.log(
        `Cloudinary disabled — seeded ${SUPERMARKET_PRODUCTS.length} products with direct Unsplash URLs.`,
      );
    }
    return products;
  }

  // ── Inventory ──────────────────────────────────────────

  private async ensureInventory(
    products: Product[],
    branchId: string,
    profile: 'healthy' | 'short',
  ): Promise<void> {
    let createdCount = 0;
    for (const product of products) {
      const existing = await this.inventoryRepository.findOne({
        where: { productId: product.id, branchId },
      });
      if (existing) continue;

      const threshold = CATEGORY_THRESHOLDS[product.category] ?? 15;
      const quantity = generateSeedQuantity(
        product.baseUnit,
        profile,
        threshold,
        `${branchId}:${product.barcode}`,
      );
      await this.inventoryRepository.save(
        this.inventoryRepository.create({
          productId: product.id,
          branchId,
          quantity,
          lowStockThreshold: threshold,
          lastRestockedAt: quantity > 0 ? new Date() : null,
        }),
      );
      createdCount++;
    }
    if (createdCount > 0) {
      this.logger.log(
        `Inventory seeded for branch ${branchId} (${profile}, ${createdCount} rows).`,
      );
    }
  }

  // ── Transactions ───────────────────────────────────────

  private async ensureTransactions(
    cashier: User,
    branchId: string,
    products: Product[],
  ): Promise<void> {
    const existingCount = await this.transactionRepository.count({
      where: { cashierId: cashier.id },
    });
    if (existingCount > 0) return;

    const paymentMethods = [
      PaymentMethod.CASH,
      PaymentMethod.CARD,
      PaymentMethod.MOBILE,
    ];
    const now = new Date();

    for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
      const txnCount = Math.floor(Math.random() * 6) + 3;
      for (let t = 0; t < txnCount; t++) {
        const txnDate = new Date(now);
        txnDate.setDate(txnDate.getDate() - daysAgo);
        txnDate.setHours(
          8 + Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60),
        );

        const itemCount = Math.floor(Math.random() * 4) + 1;
        const selectedProducts = this.shuffleArray([...products]).slice(
          0,
          itemCount,
        );

        let subtotal = 0;
        const items: Partial<SaleItem>[] = [];
        for (const prod of selectedProducts) {
          const line = buildSeedSaleLine(
            prod,
            `${cashier.id}:${branchId}:${prod.barcode}:${daysAgo}:${t}`,
          );
          subtotal += line.lineTotal;
          items.push({
            productId: prod.id,
            quantity: line.quantity,
            baseUnitQty: line.baseUnitQty,
            unitPrice: line.unitPrice,
            discountAmount: 0,
            discountType: DiscountType.NONE,
            lineTotal: line.lineTotal,
          });
        }

        const total = Math.round(subtotal * 100) / 100;
        const txnNumber = `TXN-${txnDate.getTime()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const transaction = this.transactionRepository.create({
          transactionNumber: txnNumber,
          // PHASE-5: replace with InvoiceNumberService.next() once the seed
          // migrates to PosWriteService.createSale. Until then mirror the
          // transactionNumber so the NOT NULL + UNIQUE constraint is satisfied.
          invoiceNumber: txnNumber,
          branchId,
          cashierId: cashier.id,
          type: TransactionType.SALE,
          subtotal: total,
          discountAmount: 0,
          discountType: DiscountType.NONE,
          taxAmount: 0,
          total,
          paymentMethod:
            paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          items: items as SaleItem[],
        });

        const saved = await this.transactionRepository.save(transaction);
        await this.transactionRepository
          .createQueryBuilder()
          .update(Sale)
          .set({ createdAt: txnDate })
          .where('id = :id', { id: saved.id })
          .execute();
      }
    }
    this.logger.log(`Transactions seeded for cashier ${cashier.email}.`);
  }

  // ── Ledger & Expenses ──────────────────────────────────

  private async ensureLedgerAndExpenses(
    mainBranchId: string,
    downtownBranchId: string,
    suburbanBranchId: string,
    adminId: string,
  ): Promise<void> {
    const ledgerCount = await this.ledgerRepository.count();
    if (ledgerCount > 0) return;

    const now = new Date();

    const ledgerData = [
      {
        branchId: mainBranchId,
        entryType: LedgerEntryType.CREDIT,
        amount: 4500.0,
        description: 'Daily sales — fresh produce & dairy',
        referenceNumber: 'LED-001',
      },
      {
        branchId: mainBranchId,
        entryType: LedgerEntryType.DEBIT,
        amount: 1200.0,
        description: 'Supplier payment — beverages restock',
        referenceNumber: 'LED-002',
      },
      {
        branchId: mainBranchId,
        entryType: LedgerEntryType.CREDIT,
        amount: 3800.0,
        description: 'Weekly sales deposit',
        referenceNumber: 'LED-003',
      },
      {
        branchId: mainBranchId,
        entryType: LedgerEntryType.DEBIT,
        amount: 850.0,
        description: 'Cold-chain refrigeration service',
        referenceNumber: 'LED-004',
      },
      {
        branchId: downtownBranchId,
        entryType: LedgerEntryType.CREDIT,
        amount: 3200.0,
        description: 'Daily sales — pantry & household',
        referenceNumber: 'LED-005',
      },
      {
        branchId: downtownBranchId,
        entryType: LedgerEntryType.DEBIT,
        amount: 500.0,
        description: 'Utility bill payment',
        referenceNumber: 'LED-006',
      },
      {
        branchId: mainBranchId,
        entryType: LedgerEntryType.CREDIT,
        amount: 5600.0,
        description: 'Card payment settlement',
        referenceNumber: 'LED-007',
      },
      {
        branchId: downtownBranchId,
        entryType: LedgerEntryType.CREDIT,
        amount: 2900.0,
        description: 'Mobile payment settlement',
        referenceNumber: 'LED-008',
      },
      {
        branchId: suburbanBranchId,
        entryType: LedgerEntryType.CREDIT,
        amount: 1750.0,
        description: 'Daily sales — opening week',
        referenceNumber: 'LED-009',
      },
      {
        branchId: suburbanBranchId,
        entryType: LedgerEntryType.DEBIT,
        amount: 950.0,
        description: 'Initial stock purchase',
        referenceNumber: 'LED-010',
      },
    ];
    for (const entry of ledgerData) {
      await this.ledgerRepository.save(this.ledgerRepository.create(entry));
    }

    const expenseData = [
      {
        branchId: mainBranchId,
        createdBy: adminId,
        category: 'Rent',
        amount: 2500.0,
        description: 'Monthly storefront rent',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 1),
      },
      {
        branchId: mainBranchId,
        createdBy: adminId,
        category: 'Utilities',
        amount: 350.0,
        description: 'Electricity bill — refrigeration heavy',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 5),
      },
      {
        branchId: mainBranchId,
        createdBy: adminId,
        category: 'Cold Chain',
        amount: 480.0,
        description: 'Refrigeration unit servicing',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 8),
      },
      {
        branchId: mainBranchId,
        createdBy: adminId,
        category: 'Supplies',
        amount: 180.0,
        description: 'Cleaning supplies and PPE',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 9),
      },
      {
        branchId: downtownBranchId,
        createdBy: adminId,
        category: 'Rent',
        amount: 1800.0,
        description: 'Monthly storefront rent',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 1),
      },
      {
        branchId: downtownBranchId,
        createdBy: adminId,
        category: 'Marketing',
        amount: 450.0,
        description: 'Weekly flyer + social media ads',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 10),
      },
      {
        branchId: downtownBranchId,
        createdBy: adminId,
        category: 'Spoilage',
        amount: 220.0,
        description: 'Expired dairy and bakery write-off',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 11),
      },
      {
        branchId: suburbanBranchId,
        createdBy: adminId,
        category: 'Rent',
        amount: 1600.0,
        description: 'Monthly storefront rent',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 1),
      },
      {
        branchId: suburbanBranchId,
        createdBy: adminId,
        category: 'Equipment',
        amount: 980.0,
        description: 'Walk-in freezer purchase',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 4),
      },
    ];
    for (const exp of expenseData) {
      await this.expenseRepository.save(this.expenseRepository.create(exp));
    }

    this.logger.log('Ledger entries and expenses seeded.');
  }

  // ── Notifications ─────────────────────────────────────

  private async ensureNotifications(users: User[]): Promise<void> {
    const existingCount = await this.notificationRepository.count();
    if (existingCount > 0) return;

    const now = new Date();
    const notificationData: {
      userId: string;
      title: string;
      message: string;
      type: NotificationType;
      isRead: boolean;
      hoursAgo: number;
    }[] = [
      // Admin
      {
        userId: users[0].id,
        title: 'Low Stock Alert',
        message:
          'Whole Milk 1L is below threshold (8 remaining at Suburban Branch)',
        type: NotificationType.LOW_STOCK,
        isRead: false,
        hoursAgo: 1,
      },
      {
        userId: users[0].id,
        title: 'Low Stock Alert',
        message:
          'White Bread Loaf is critically low (3 remaining at Suburban Branch)',
        type: NotificationType.LOW_STOCK,
        isRead: false,
        hoursAgo: 3,
      },
      {
        userId: users[0].id,
        title: 'New Transfer Request',
        message: 'Downtown Branch requested 50 unit(s) of Coca-Cola 1.5L',
        type: NotificationType.STOCK_TRANSFER,
        isRead: false,
        hoursAgo: 2,
      },
      {
        userId: users[0].id,
        title: 'New User Created',
        message: 'Cashier account cashier3@ledgerpro.com has been created',
        type: NotificationType.SYSTEM,
        isRead: true,
        hoursAgo: 12,
      },
      {
        userId: users[0].id,
        title: 'System Update',
        message: 'LedgerPro has been updated to version 2.1.0',
        type: NotificationType.SYSTEM,
        isRead: true,
        hoursAgo: 24,
      },
      {
        userId: users[0].id,
        title: 'Daily Report Ready',
        message: 'Your daily sales report for yesterday is now available',
        type: NotificationType.SYSTEM,
        isRead: false,
        hoursAgo: 6,
      },
      // Cashier 1 (Main Branch)
      {
        userId: users[1].id,
        title: 'Low Stock Alert',
        message: 'Eggs (12) is below threshold at Main Branch',
        type: NotificationType.LOW_STOCK,
        isRead: false,
        hoursAgo: 2,
      },
      {
        userId: users[1].id,
        title: 'Security Alert',
        message: 'New login detected from a different device',
        type: NotificationType.ALERT,
        isRead: false,
        hoursAgo: 5,
      },
      // Cashier 2 (Downtown)
      {
        userId: users[2].id,
        title: 'Daily Report Ready',
        message: 'Your daily sales report for yesterday is now available',
        type: NotificationType.SYSTEM,
        isRead: false,
        hoursAgo: 8,
      },
    ];

    for (const n of notificationData) {
      const createdAt = new Date(now);
      createdAt.setHours(createdAt.getHours() - n.hoursAgo);

      const saved = await this.notificationRepository.save(
        this.notificationRepository.create({
          userId: n.userId,
          title: n.title,
          message: n.message,
          type: n.type,
          isRead: n.isRead,
        }),
      );

      await this.notificationRepository
        .createQueryBuilder()
        .update(Notification)
        .set({ createdAt })
        .where('id = :id', { id: saved.id })
        .execute();
    }
    this.logger.log('Notifications seeded.');
  }

  // ── Stock Transfers ────────────────────────────────────

  private async ensureStockTransfers(ctx: {
    mainBranch: Branch;
    downtownBranch: Branch;
    suburbanBranch: Branch;
    admin: User;
    mainManager: User;
    downtownManager: User;
    suburbanManager: User;
    products: Product[];
  }): Promise<void> {
    const existingCount = await this.stockTransferRepository.count();
    if (existingCount > 0) return;

    const productByBarcode = new Map(ctx.products.map((p) => [p.barcode, p]));
    const get = (barcode: string): Product | null =>
      productByBarcode.get(barcode) ?? null;

    const cola = get('BVG-001');
    const milk = get('DRY-001');
    const yogurt = get('DRY-003');
    const bread = get('BKY-001');
    const chips = get('SNK-001');
    if (!cola || !milk || !yogurt || !bread || !chips) {
      this.logger.warn(
        'Stock transfer seed skipped — required products not found',
      );
      return;
    }

    const now = Date.now();
    const hoursAgo = (n: number): Date => new Date(now - n * 3600_000);
    const daysAgo = (n: number): Date => new Date(now - n * 86400_000);

    const transfers: Partial<StockTransferRequest>[] = [
      // 1) PENDING — Downtown manager wants 50 Coca-Cola, no source yet
      {
        productId: cola.id,
        destinationBranchId: ctx.downtownBranch.id,
        sourceBranchId: null,
        requestedQuantity: 50,
        approvedQuantity: null,
        status: TransferStatus.PENDING,
        requestReason: 'Weekend rush — main aisle is nearly empty',
        requestedByUserId: ctx.downtownManager.id,
      },
      // 2) APPROVED — Suburban manager requested bread, admin approved with Main as source
      {
        productId: bread.id,
        destinationBranchId: ctx.suburbanBranch.id,
        sourceBranchId: ctx.mainBranch.id,
        requestedQuantity: 30,
        approvedQuantity: 30,
        status: TransferStatus.APPROVED,
        requestReason: 'Bakery delivery delayed by supplier',
        requestedByUserId: ctx.suburbanManager.id,
        reviewedByUserId: ctx.admin.id,
        reviewedAt: hoursAgo(4),
      },
      // 3) IN_TRANSIT — Downtown requested milk, Main shipped, awaiting receipt
      {
        productId: milk.id,
        destinationBranchId: ctx.downtownBranch.id,
        sourceBranchId: ctx.mainBranch.id,
        requestedQuantity: 100,
        approvedQuantity: 100,
        status: TransferStatus.IN_TRANSIT,
        requestReason: 'Routine top-up before weekend',
        requestedByUserId: ctx.downtownManager.id,
        reviewedByUserId: ctx.admin.id,
        reviewedAt: daysAgo(1),
        shippedByUserId: ctx.mainManager.id,
        shippedAt: hoursAgo(2),
      },
      // 4) COMPLETED — Yogurt transfer Suburban → Downtown, fully completed
      {
        productId: yogurt.id,
        destinationBranchId: ctx.downtownBranch.id,
        sourceBranchId: ctx.suburbanBranch.id,
        requestedQuantity: 20,
        approvedQuantity: 20,
        status: TransferStatus.COMPLETED,
        requestReason: 'Customer special order',
        requestedByUserId: ctx.downtownManager.id,
        reviewedByUserId: ctx.admin.id,
        reviewedAt: daysAgo(3),
        shippedByUserId: ctx.suburbanManager.id,
        shippedAt: daysAgo(2),
        receivedByUserId: ctx.downtownManager.id,
        receivedAt: daysAgo(1),
      },
      // 5) REJECTED — Suburban requested 200 chips, admin rejected (not enough surplus)
      {
        productId: chips.id,
        destinationBranchId: ctx.suburbanBranch.id,
        sourceBranchId: null,
        requestedQuantity: 200,
        approvedQuantity: null,
        status: TransferStatus.REJECTED,
        requestReason: 'Anticipating snack promotion next week',
        rejectionReason:
          'No other branch has enough surplus — please order from supplier directly',
        requestedByUserId: ctx.suburbanManager.id,
        reviewedByUserId: ctx.admin.id,
        reviewedAt: hoursAgo(8),
      },
    ];

    const createdAtOffsets = [
      hoursAgo(2),
      hoursAgo(6),
      daysAgo(1.5),
      daysAgo(4),
      hoursAgo(10),
    ];

    for (let i = 0; i < transfers.length; i++) {
      const draft = transfers[i];
      const saved = await this.stockTransferRepository.save(
        this.stockTransferRepository.create(draft),
      );
      await this.stockTransferRepository
        .createQueryBuilder()
        .update(StockTransferRequest)
        .set({ createdAt: createdAtOffsets[i] })
        .where('id = :id', { id: saved.id })
        .execute();
    }

    this.logger.log(`${transfers.length} sample stock transfers seeded.`);
  }

  // ── Helpers ────────────────────────────────────────────

  private async uploadWithTimeout(
    sourceUrl: string,
    productId: string,
    timeoutMs = 10_000,
  ): Promise<{ url: string; publicId: string }> {
    return Promise.race([
      this.cloudinary.uploadImageFromUrl(sourceUrl, {
        folder: 'ledgerpro/products',
        publicId: productId,
      }),
      new Promise<{ url: string; publicId: string }>((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error(`Cloudinary upload timed out after ${timeoutMs}ms`),
            ),
          timeoutMs,
        ),
      ),
    ]);
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private getSeedDefaults(): SeedDefaults {
    return {
      adminEmail: this.getConfigValue(
        'SEED_ADMIN_EMAIL',
        'admin@ledgerpro.com',
      ),
      adminPassword: this.getConfigValue('SEED_ADMIN_PASSWORD', 'Admin@123'),
      adminFirstName: this.getConfigValue('SEED_ADMIN_FIRST_NAME', 'System'),
      adminLastName: this.getConfigValue('SEED_ADMIN_LAST_NAME', 'Admin'),
      branchName: this.getConfigValue('SEED_ADMIN_BRANCH_NAME', 'Main Branch'),
      branchAddress: this.getConfigValue(
        'SEED_ADMIN_BRANCH_ADDRESS',
        'Head Office',
      ),
      branchPhone: this.getConfigValue(
        'SEED_ADMIN_BRANCH_PHONE',
        '+94000000000',
      ),
    };
  }

  private getConfigValue(key: string, fallback: string): string {
    const value = this.configService.get<string>(key);
    if (!value) return fallback;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
}
