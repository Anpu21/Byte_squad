import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { Category } from '@/modules/categories/entities/category.entity';
import { ProductSellableUnit } from '@products/entities/product-sellable-unit.entity';
import { defaultSellableUnitsFor } from '@products/lib/default-sellable-units';
import { Inventory } from '@inventory/entities/inventory.entity';
import { ProductBatch } from '@inventory/entities/product-batch.entity';
import { StockAdjustment } from '@inventory/entities/stock-adjustment.entity';
import { SalesReturn } from '@inventory/entities/sales-return.entity';
import { SalesReturnItem } from '@inventory/entities/sales-return-item.entity';
import { Sale } from '@pos/entities/sale.entity';
import { SaleItem } from '@pos/entities/sale-item.entity';
import { StockMovement } from '@pos/entities/stock-movement.entity';
import { Payment } from '@pos/entities/payment.entity';
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
import { StockAdjustmentReason } from '@common/enums/stock-adjustment-reason.enum';
import { StockAdjustmentStatus } from '@common/enums/stock-adjustment-status.enum';
import { ExpenseStatus } from '@common/enums/expense-status.enum';
import { CustomerOrder } from '@/modules/customer-orders/entities/customer-order.entity';
import { CustomerOrderStatus } from '@common/enums/customer-order.enum';
import { CustomerOrderPaymentMode } from '@common/enums/customer-order-payment-mode.enum';
import { CustomerOrderPaymentStatus } from '@common/enums/customer-order-payment-status.enum';
import { LoyaltyAccount } from '@/modules/loyalty/entities/loyalty-account.entity';
import { LoyaltyCustomer } from '@/modules/loyalty/entities/loyalty-customer.entity';
import { LoyaltyLedgerEntry } from '@/modules/loyalty/entities/loyalty-ledger-entry.entity';
import { LoyaltyLedgerEntryType } from '@common/enums/loyalty-ledger-entry-type.enum';
import { CloudinaryService } from '@common/cloudinary/cloudinary.service';
import { pickSeedImageUrl } from '@common/seeds/seed-product-images';
import { HrSeedService } from '@common/seeds/hr-seed.service';
import { PurchasesSeedService } from '@common/seeds/purchases-seed.service';
import {
  CATEGORY_THRESHOLDS,
  SUPERMARKET_PRODUCTS,
} from '@common/seeds/supermarket-products.seed';
import {
  buildSeedSaleLine,
  generateSeedQuantity,
  stableInt,
} from '@common/seeds/seed-quantity';
import type { PosPaymentMethod } from '@pos/types';

interface SeedDefaults {
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
}

interface BranchComparisonSeedProfile {
  branch: Branch;
  cashier: User;
  code: string;
  dailyBaseCount: number;
  basketScale: number;
  paymentMethods: PosPaymentMethod[];
  expenseBase: number;
  orderCounts: {
    completed: number;
    cancelled: number;
    rejected: number;
  };
  loyaltyScale: number;
}

export const STANDALONE_SEED_ENV = 'LEDGERPRO_STANDALONE_SEED';

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
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(ProductSellableUnit)
    private readonly sellableUnitRepository: Repository<ProductSellableUnit>,
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(ProductBatch)
    private readonly productBatchRepository: Repository<ProductBatch>,
    @InjectRepository(StockAdjustment)
    private readonly stockAdjustmentRepository: Repository<StockAdjustment>,
    @InjectRepository(SalesReturn)
    private readonly salesReturnRepository: Repository<SalesReturn>,
    @InjectRepository(StockMovement)
    private readonly stockMovementRepository: Repository<StockMovement>,
    @InjectRepository(Sale)
    private readonly transactionRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly transactionItemRepository: Repository<SaleItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(LedgerEntry)
    private readonly ledgerRepository: Repository<LedgerEntry>,
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,
    @InjectRepository(CustomerOrder)
    private readonly customerOrderRepository: Repository<CustomerOrder>,
    @InjectRepository(LoyaltyAccount)
    private readonly loyaltyAccountRepository: Repository<LoyaltyAccount>,
    @InjectRepository(LoyaltyCustomer)
    private readonly loyaltyCustomerRepository: Repository<LoyaltyCustomer>,
    @InjectRepository(LoyaltyLedgerEntry)
    private readonly loyaltyLedgerRepository: Repository<LoyaltyLedgerEntry>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(StockTransferRequest)
    private readonly stockTransferRepository: Repository<StockTransferRequest>,
    private readonly configService: ConfigService,
    private readonly cloudinary: CloudinaryService,
    private readonly hrSeed: HrSeedService,
    private readonly purchasesSeed: PurchasesSeedService,
  ) {}

  onModuleInit(): void {
    if (process.env[STANDALONE_SEED_ENV] === 'true') return;

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

    // Workers — branch-floor staff (no POS / management access) who act as
    // couriers for the stock-transfer delivery flow. Each is linked to an
    // Employee row in the HR seed so attendance + working hours work.
    const worker1 = await this.ensureUser({
      email: 'worker@ledgerpro.com',
      password: 'Worker@123',
      firstName: 'Ravi',
      lastName: 'Bandara',
      role: UserRole.WORKER,
      branchId: mainBranch.id,
    });

    const worker2 = await this.ensureUser({
      email: 'worker2@ledgerpro.com',
      password: 'Worker@123',
      firstName: 'Sunil',
      lastName: 'Rathnayake',
      role: UserRole.WORKER,
      branchId: downtownBranch.id,
    });

    const worker3 = await this.ensureUser({
      email: 'worker3@ledgerpro.com',
      password: 'Worker@123',
      firstName: 'Pradeep',
      lastName: 'Gunawardena',
      role: UserRole.WORKER,
      branchId: suburbanBranch.id,
    });

    const customerUsers = await Promise.all([
      this.ensureUser({
        email: 'customer.ayesha@ledgerpro.com',
        password: 'Customer@123',
        firstName: 'Ayesha',
        lastName: 'Perera',
        role: UserRole.CUSTOMER,
        branchId: mainBranch.id,
      }),
      this.ensureUser({
        email: 'customer.nuwan@ledgerpro.com',
        password: 'Customer@123',
        firstName: 'Nuwan',
        lastName: 'Fernando',
        role: UserRole.CUSTOMER,
        branchId: downtownBranch.id,
      }),
      this.ensureUser({
        email: 'customer.malini@ledgerpro.com',
        password: 'Customer@123',
        firstName: 'Malini',
        lastName: 'Silva',
        role: UserRole.CUSTOMER,
        branchId: suburbanBranch.id,
      }),
      this.ensureUser({
        email: 'customer.dinesh@ledgerpro.com',
        password: 'Customer@123',
        firstName: 'Dinesh',
        lastName: 'Jayasinghe',
        role: UserRole.CUSTOMER,
        branchId: mainBranch.id,
      }),
    ]);

    // 3. Products — supermarket catalogue (idempotent by barcode)
    const categoryMap = await this.ensureCategories(admin);
    const products = await this.ensureProducts(categoryMap);

    // 4. Inventory — vary distribution per branch so low-stock and out-of-stock
    //    states exist naturally for testing the transfer feature.
    await this.ensureInventory(products, mainBranch.id, 'healthy');
    await this.ensureInventory(products, downtownBranch.id, 'healthy');
    await this.ensureInventory(products, suburbanBranch.id, 'short');

    // 4b. Product expiry batches — perishable stock across every severity
    //     bucket so the expiry report + alerts have data on a fresh DB.
    //     Additive only: the inventory quantities above are left untouched.
    await this.ensureProductBatches(
      products,
      [mainBranch, downtownBranch, suburbanBranch],
      admin,
    );

    // 4c. Stock adjustments — reason-coded corrections spanning every reason
    //     and all three statuses, each with its audit movement. Additive: the
    //     inventory quantities above stay the authoritative current totals.
    await this.ensureStockAdjustments(
      products,
      [
        { branch: mainBranch, manager: mainManager },
        { branch: downtownBranch, manager: downtownManager },
        { branch: suburbanBranch, manager: suburbanManager },
      ],
      admin,
    );

    // 5. Transactions — last 7 days of POS sales
    await this.ensureTransactions(cashier1, mainBranch.id, products);
    await this.ensureTransactions(cashier2, downtownBranch.id, products);
    await this.ensureTransactions(cashier3, suburbanBranch.id, products);

    // 5b. Deterministic analytics data for the branch comparison dashboard.
    await this.ensureBranchComparisonDemoData({
      mainBranch,
      downtownBranch,
      suburbanBranch,
      admin,
      cashiers: {
        [mainBranch.id]: cashier1,
        [downtownBranch.id]: cashier2,
        [suburbanBranch.id]: cashier3,
      },
      customerUsers,
      products,
    });

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

    // 8b. Sales returns — partial, item-level returns against the seeded POS
    //     sales, each with restock movements + a refund ledger entry. MUST run
    //     after ensureLedgerAndExpenses (step 6): that seed short-circuits on a
    //     global ledger-row count, so writing refund rows earlier would suppress
    //     the whole ledger/expense seed.
    await this.ensureSalesReturns([
      { branch: mainBranch, cashier: cashier1 },
      { branch: downtownBranch, cashier: cashier2 },
      { branch: suburbanBranch, cashier: cashier3 },
    ]);

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
      worker1,
      worker2,
      worker3,
    });

    // 10. Purchases demo seed — suppliers, a sent PO, two GRNs (one aged),
    //     a partial bill-by-bill payment, and a debit note. Drives the real
    //     purchases services so stock/cost/ledger land consistently.
    await this.purchasesSeed.seed({
      admin,
      mainBranch,
      products,
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

  /**
   * Ensure a managed Category row exists for each distinct catalogue category,
   * returning a name→id map so products link via their FK. Idempotent
   * (find-by-name); created rows are attributed to the seed admin.
   */
  private async ensureCategories(admin: User): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    const names = Array.from(
      new Set(SUPERMARKET_PRODUCTS.map((p) => p.category)),
    );
    let created = 0;
    for (const [index, name] of names.entries()) {
      let category = await this.categoryRepository.findOne({ where: { name } });
      if (!category) {
        category = await this.categoryRepository.save(
          this.categoryRepository.create({
            name,
            sortOrder: index,
            createdByUserId: admin.id,
          }),
        );
        created += 1;
      }
      map.set(name, category.id);
    }
    if (created > 0) {
      this.logger.log(`Categories seeded (${created} rows).`);
    }
    return map;
  }

  private async ensureProducts(
    categoryMap: Map<string, string>,
  ): Promise<Product[]> {
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
          this.productRepository.create({
            ...p,
            isActive: true,
            categoryId: categoryMap.get(p.category) ?? null,
          }),
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
        const desiredCategoryId = categoryMap.get(p.category) ?? null;
        if (product.categoryId !== desiredCategoryId) {
          patch.categoryId = desiredCategoryId;
          product.categoryId = desiredCategoryId;
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

  // ── Product expiry batches ─────────────────────────────

  /**
   * Seed ProductBatch rows for perishable products so the expiry report and
   * its severity buckets (expired / critical / warning / ok) are populated on
   * a fresh DB. Purely additive — `inventory.quantity` is the authoritative
   * sell-from total and is left untouched; batches are a reporting layer.
   * Deterministic (no randomness) and idempotent via a count-check, matching
   * the other bulk-demo seeds in this file.
   */
  private async ensureProductBatches(
    products: Product[],
    branches: Branch[],
    admin: User,
  ): Promise<void> {
    if ((await this.productBatchRepository.count()) > 0) return;

    const perishableCategories = new Set(['Dairy', 'Bakery', 'Produce']);
    const perishables = products.filter((p) =>
      perishableCategories.has(p.category),
    );

    // Day offsets relative to today, one per severity bucket. Each value sits
    // clear of the bucket boundaries (0 / 7 / 8 / 30) so timezone rounding
    // can never tip a batch into a neighbouring bucket.
    const offsets = [-5, 3, 20, 120]; // expired, critical, warning, ok
    const now = new Date();
    let createdCount = 0;

    for (const branch of branches) {
      for (const [index, product] of perishables.entries()) {
        const key = `batch:${branch.id}:${product.barcode}`;
        const count = 2 + stableInt(`${key}:count`, 0, 1); // 2..3 batches
        // Rotate the starting bucket by product index so every branch covers
        // all four buckets by construction (not left to UUID-hash chance).
        const start = index % offsets.length;
        const threshold = CATEGORY_THRESHOLDS[product.category] ?? 15;
        const floor = product.baseUnit === 'unit' ? 1 : 0.5;

        for (let i = 0; i < count; i += 1) {
          const offsetDays = offsets[(start + i) % offsets.length];
          // Clamp to a positive floor: generateSeedQuantity returns 0 ~5% of
          // the time, and findExpiring requires quantity > 0 to surface a row.
          const quantity = Math.max(
            floor,
            generateSeedQuantity(
              product.baseUnit,
              'healthy',
              threshold,
              `${key}:${i}:qty`,
            ),
          );
          await this.productBatchRepository.save(
            this.productBatchRepository.create({
              productId: product.id,
              branchId: branch.id,
              batchNo: `LOT-${product.barcode}-${branch.code}-${i + 1}`,
              expiryDate: this.addDaysUtcDateString(now, offsetDays),
              quantity,
              receivedAt: new Date(now.getTime() - (30 + i) * 86_400_000),
              notes: null,
              createdByUserId: admin.id,
            }),
          );
          createdCount += 1;
        }
      }
    }

    if (createdCount > 0) {
      this.logger.log(`Product expiry batches seeded (${createdCount} rows).`);
    }
  }

  /** Format `base + days` as a UTC `YYYY-MM-DD` string for a `date` column. */
  private addDaysUtcDateString(base: Date, days: number): string {
    const d = new Date(
      Date.UTC(
        base.getUTCFullYear(),
        base.getUTCMonth(),
        base.getUTCDate() + days,
      ),
    );
    return d.toISOString().slice(0, 10);
  }

  // ── Stock adjustments ──────────────────────────────────

  /**
   * Seed reason-coded `StockAdjustment` rows (Phase C2) so the adjustments
   * report and its approval queue have data on a fresh DB. Each Approved /
   * Reversed row also writes the matching `Adjustment` `StockMovement` so the
   * audit ledger stays complete. Purely additive — these are historical
   * corrections already reflected in the seeded `inventory.quantity`, so the
   * on-hand totals are left untouched (same philosophy as `ensureProductBatches`).
   * Deterministic (`stableInt`) and idempotent via a count-check.
   */
  private async ensureStockAdjustments(
    products: Product[],
    branches: { branch: Branch; manager: User }[],
    admin: User,
  ): Promise<void> {
    if ((await this.stockAdjustmentRepository.count()) > 0) return;
    if (products.length === 0) return;

    const round3 = (n: number): number => Math.round(n * 1000) / 1000;

    // Six (reason, status) slots per branch covering every reason and all three
    // statuses. Loss reasons subtract stock; a stock-take can swing either way.
    const slots: {
      reason: StockAdjustmentReason;
      status: StockAdjustmentStatus;
      sign: -1 | 1;
      note: string;
    }[] = [
      {
        reason: StockAdjustmentReason.DAMAGE,
        status: StockAdjustmentStatus.APPROVED,
        sign: -1,
        note: 'Crushed in transit',
      },
      {
        reason: StockAdjustmentReason.EXPIRED,
        status: StockAdjustmentStatus.APPROVED,
        sign: -1,
        note: 'Past sell-by, pulled from shelf',
      },
      {
        reason: StockAdjustmentReason.THEFT,
        status: StockAdjustmentStatus.APPROVED,
        sign: -1,
        note: 'Shrinkage flagged during audit',
      },
      {
        reason: StockAdjustmentReason.STOCK_TAKE,
        status: StockAdjustmentStatus.APPROVED,
        sign: 1,
        note: 'Cycle count correction — found extra',
      },
      {
        reason: StockAdjustmentReason.OTHER,
        status: StockAdjustmentStatus.PENDING,
        sign: -1,
        note: 'Awaiting admin review',
      },
      {
        reason: StockAdjustmentReason.STOCK_TAKE,
        status: StockAdjustmentStatus.REVERSED,
        sign: -1,
        note: 'Miscount — reversed after recount',
      },
    ];

    const now = Date.now();
    let created = 0;

    for (const [branchIndex, { branch, manager }] of branches.entries()) {
      for (const [slotIndex, slot] of slots.entries()) {
        const product =
          products[(branchIndex * slots.length + slotIndex) % products.length];

        const inv = await this.inventoryRepository.findOne({
          where: { productId: product.id, branchId: branch.id },
        });
        const before = inv ? Number(inv.quantity) : 0;

        const magnitude = stableInt(
          `adj:${branch.id}:${product.barcode}:${slotIndex}`,
          2,
          18,
        );
        let physical = before + slot.sign * magnitude;
        if (physical < 0) physical = 0;
        if (product.baseUnit === 'unit') physical = Math.round(physical);
        physical = round3(physical);
        const difference = round3(physical - before);

        const createdAt = new Date(now - (10 - slotIndex) * 86_400_000);
        const isPending = slot.status === StockAdjustmentStatus.PENDING;
        const isReversed = slot.status === StockAdjustmentStatus.REVERSED;
        const reviewedAt = isPending
          ? null
          : new Date(createdAt.getTime() + 3 * 3_600_000);

        const saved = await this.stockAdjustmentRepository.save(
          this.stockAdjustmentRepository.create({
            productId: product.id,
            branchId: branch.id,
            reason: slot.reason,
            status: slot.status,
            quantityBefore: before,
            physicalQuantity: physical,
            difference,
            notes: slot.note,
            createdByUserId: manager.id,
            reviewedByUserId: isPending ? null : admin.id,
            reviewedAt,
            reversedByUserId: isReversed ? admin.id : null,
            reversedAt: isReversed
              ? new Date(createdAt.getTime() + 27 * 3_600_000)
              : null,
          }),
        );
        await this.stockAdjustmentRepository
          .createQueryBuilder()
          .update(StockAdjustment)
          .set({ createdAt })
          .where('id = :id', { id: saved.id })
          .execute();

        // Approved + Reversed adjustments were applied to stock at some point,
        // so they leave an `Adjustment` movement in the audit ledger. Pending
        // ones have not touched stock yet. `inventory.quantity` is never
        // modified here — balanceAfter is the historical point-in-time figure.
        if (!isPending) {
          const movement = await this.stockMovementRepository.save(
            this.stockMovementRepository.create({
              productId: product.id,
              branchId: branch.id,
              location: 'Shop',
              movementType: 'Adjustment',
              qtyIn: difference > 0 ? difference : 0,
              qtyOut: difference < 0 ? -difference : 0,
              balanceAfter: physical,
              refType: 'StockAdjustment',
              refId: saved.id,
              notes: `${slot.reason}: ${slot.note}`,
              createdByUserId: manager.id,
            }),
          );
          await this.stockMovementRepository
            .createQueryBuilder()
            .update(StockMovement)
            .set({ createdAt: reviewedAt ?? createdAt })
            .where('id = :id', { id: movement.id })
            .execute();
        }
        created += 1;
      }
    }

    if (created > 0) {
      this.logger.log(`Stock adjustments seeded (${created} rows).`);
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

  private async ensureBranchComparisonDemoData(ctx: {
    mainBranch: Branch;
    downtownBranch: Branch;
    suburbanBranch: Branch;
    admin: User;
    cashiers: Record<string, User>;
    customerUsers: User[];
    products: Product[];
  }): Promise<void> {
    const productByBarcode = new Map(ctx.products.map((p) => [p.barcode, p]));
    const demoProducts = [
      'BVG-001',
      'DRY-001',
      'DRY-006',
      'BKY-001',
      'PRD-001',
      'PRD-002',
      'PRD-003',
      'PNT-001',
      'PNT-007',
    ]
      .map((barcode) => productByBarcode.get(barcode))
      .filter((product): product is Product => !!product);

    if (demoProducts.length < 5) {
      this.logger.warn(
        'Branch comparison demo seed skipped — required products not found.',
      );
      return;
    }

    const profiles: BranchComparisonSeedProfile[] = [
      {
        branch: ctx.mainBranch,
        cashier: ctx.cashiers[ctx.mainBranch.id],
        code: 'MAIN',
        dailyBaseCount: 10,
        basketScale: 1.22,
        paymentMethods: ['Cash', 'Card', 'Card', 'Mobile', 'Bank'],
        expenseBase: 13200,
        orderCounts: { completed: 14, cancelled: 2, rejected: 1 },
        loyaltyScale: 1.3,
      },
      {
        branch: ctx.downtownBranch,
        cashier: ctx.cashiers[ctx.downtownBranch.id],
        code: 'DOWN',
        dailyBaseCount: 7,
        basketScale: 0.96,
        paymentMethods: ['Cash', 'Cash', 'Card', 'Mobile', 'Cheque'],
        expenseBase: 9800,
        orderCounts: { completed: 10, cancelled: 3, rejected: 2 },
        loyaltyScale: 0.95,
      },
      {
        branch: ctx.suburbanBranch,
        cashier: ctx.cashiers[ctx.suburbanBranch.id],
        code: 'SUB',
        dailyBaseCount: 5,
        basketScale: 0.74,
        paymentMethods: ['Cash', 'Mobile', 'Credit', 'Card'],
        expenseBase: 7600,
        orderCounts: { completed: 7, cancelled: 4, rejected: 3 },
        loyaltyScale: 0.72,
      },
    ];

    await this.ensureBranchComparisonSales(profiles, demoProducts);
    await this.ensureBranchComparisonExpenses(profiles, ctx.admin.id);
    const orderIdsByBranch = await this.ensureBranchComparisonOrders(
      profiles,
      demoProducts,
      ctx.customerUsers,
    );
    await this.ensureBranchComparisonLoyalty(profiles, orderIdsByBranch);
  }

  private async ensureBranchComparisonSales(
    profiles: BranchComparisonSeedProfile[],
    products: Product[],
  ): Promise<void> {
    let createdSales = 0;
    let createdPayments = 0;

    for (const profile of profiles) {
      for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
        const saleCount = profile.dailyBaseCount + ((6 - daysAgo) % 3);
        for (let index = 0; index < saleCount; index++) {
          const saleDate = this.branchComparisonDate(daysAgo, 9 + index);
          const saleNo = `BCMP-${profile.code}-${daysAgo}-${index}`;
          const itemCount = 2 + ((daysAgo + index) % 3);
          const items: Partial<SaleItem>[] = [];
          let subtotal = 0;

          for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
            const product =
              products[(index + itemIndex + daysAgo) % products.length];
            const quantity = this.demoQuantity(product, index + itemIndex);
            const unitPrice = Number(product.sellingPrice);
            const lineSubtotal =
              Math.round(quantity * unitPrice * profile.basketScale * 100) /
              100;
            subtotal += lineSubtotal;
            items.push({
              productId: product.id,
              quantity,
              baseUnitQty: quantity,
              unitId: null,
              unitPrice,
              discountAmount: 0,
              discountType: DiscountType.NONE,
              lineSubtotal,
              lineDiscountPercentage: 0,
              lineTaxRate: 0,
              lineTaxAmount: 0,
              lineTotal: lineSubtotal,
              priceLevelUsed: 'Retail',
              free: 0,
              status: 'Active',
            });
          }

          const discountAmount =
            index % 5 === 0 ? Math.round(subtotal * 0.04 * 100) / 100 : 0;
          const taxAmount =
            index % 4 === 0 ? Math.round(subtotal * 0.025 * 100) / 100 : 0;
          const total = Math.max(
            0,
            Math.round((subtotal - discountAmount + taxAmount) * 100) / 100,
          );
          const paymentMethod =
            profile.paymentMethods[index % profile.paymentMethods.length];
          const existingSale = await this.transactionRepository.findOne({
            where: { transactionNumber: saleNo },
          });

          if (existingSale) {
            const paymentCreated = await this.ensureBranchComparisonPayment({
              saleId: existingSale.id,
              saleNo,
              paymentMethod,
              total: Number(existingSale.total),
            });
            if (paymentCreated) createdPayments++;
            continue;
          }

          const sale = await this.transactionRepository.save(
            this.transactionRepository.create({
              transactionNumber: saleNo,
              invoiceNumber: saleNo,
              branchId: profile.branch.id,
              cashierId: profile.cashier.id,
              type: TransactionType.SALE,
              subtotal,
              discountAmount,
              discountType:
                discountAmount > 0 ? DiscountType.FIXED : DiscountType.NONE,
              taxAmount,
              total,
              paymentMethod: this.legacyPaymentMethod(paymentMethod),
              paidAmount: total,
              balanceDue: 0,
              paymentStatus: 'Paid',
              status: 'Active',
              location: 'Shop',
              items: items as SaleItem[],
            }),
          );
          await this.transactionRepository
            .createQueryBuilder()
            .update(Sale)
            .set({ createdAt: saleDate })
            .where('id = :id', { id: sale.id })
            .execute();

          createdSales++;
          const paymentCreated = await this.ensureBranchComparisonPayment({
            saleId: sale.id,
            saleNo,
            paymentMethod,
            total,
          });
          if (paymentCreated) createdPayments++;
        }
      }
    }

    this.logger.log(
      `Branch comparison POS seed ready (${createdSales} sales, ${createdPayments} payments created).`,
    );
  }

  private async ensureBranchComparisonPayment(data: {
    saleId: string;
    saleNo: string;
    paymentMethod: PosPaymentMethod;
    total: number;
  }): Promise<boolean> {
    const receiptNo = `RCPT-${data.saleNo}`;
    const existing = await this.paymentRepository.findOne({
      where: { receiptNo },
    });
    if (existing) return false;

    await this.paymentRepository.save(
      this.paymentRepository.create({
        saleId: data.saleId,
        receiptNo,
        paymentMethod: data.paymentMethod,
        paymentAmount: data.total,
        invoiceTotal: data.total,
        ...this.demoPaymentAmounts(data.paymentMethod, data.total),
        status: 'Active',
      }),
    );
    return true;
  }

  private async ensureBranchComparisonExpenses(
    profiles: BranchComparisonSeedProfile[],
    adminId: string,
  ): Promise<void> {
    const categories = ['Rent', 'Utilities', 'Spoilage', 'Local Marketing'];
    let createdCount = 0;
    for (const profile of profiles) {
      for (let index = 0; index < categories.length; index++) {
        const amount = Math.round(profile.expenseBase * (0.16 + index * 0.08));
        const expenseDate = this.branchComparisonDate(6 - index, 10 + index);
        const description = `Branch compare demo: ${profile.code} ${categories[index]}`;
        const existing = await this.expenseRepository.findOne({
          where: { description },
        });
        if (existing) continue;

        await this.expenseRepository.save(
          this.expenseRepository.create({
            branchId: profile.branch.id,
            createdBy: adminId,
            category: categories[index],
            amount,
            description,
            expenseDate,
            status: ExpenseStatus.APPROVED,
            reviewedBy: adminId,
            reviewedAt: expenseDate,
            reviewNote: 'Approved by demo seed for branch comparison charts.',
          }),
        );
        createdCount++;
      }
    }
    this.logger.log(
      `Branch comparison approved expenses ready (${createdCount} created).`,
    );
  }

  private async ensureBranchComparisonOrders(
    profiles: BranchComparisonSeedProfile[],
    products: Product[],
    customerUsers: User[],
  ): Promise<Map<string, string[]>> {
    const existingOrders = await this.customerOrderRepository
      .createQueryBuilder('orders')
      .where('orders.order_code LIKE :prefix', { prefix: 'BCMP-ORD-%' })
      .getMany();
    const ordersByCode = new Map(
      existingOrders.map((order) => [order.orderCode, order]),
    );

    const statusesFor = (profile: BranchComparisonSeedProfile) => [
      ...Array.from(
        { length: profile.orderCounts.completed },
        () => CustomerOrderStatus.COMPLETED,
      ),
      ...Array.from(
        { length: profile.orderCounts.cancelled },
        () => CustomerOrderStatus.CANCELLED,
      ),
      ...Array.from(
        { length: profile.orderCounts.rejected },
        () => CustomerOrderStatus.REJECTED,
      ),
    ];

    const savedOrders: CustomerOrder[] = [];
    let createdCount = 0;
    for (const profile of profiles) {
      const statuses = statusesFor(profile);
      for (let index = 0; index < statuses.length; index++) {
        const product =
          products[(index + profile.code.length) % products.length];
        const quantity = 1 + (index % 4);
        const estimatedTotal = quantity * Number(product.sellingPrice);
        const status = statuses[index];
        const orderDate = this.branchComparisonDate(index % 7, 11 + index);
        const user = customerUsers[index % customerUsers.length];
        const paid = status !== CustomerOrderStatus.REJECTED;
        const orderCode = `BCMP-ORD-${profile.code}-${String(index + 1).padStart(2, '0')}`;
        const existing = ordersByCode.get(orderCode);
        if (existing) {
          savedOrders.push(existing);
          continue;
        }

        const order = await this.customerOrderRepository.save(
          this.customerOrderRepository.create({
            orderCode,
            userId: user.id,
            branchId: profile.branch.id,
            status,
            estimatedTotal,
            loyaltyDiscountAmount: index % 5 === 0 ? 120 : 0,
            finalTotal: Math.max(
              0,
              estimatedTotal - (index % 5 === 0 ? 120 : 0),
            ),
            paymentMode:
              index % 3 === 0
                ? CustomerOrderPaymentMode.ONLINE
                : CustomerOrderPaymentMode.MANUAL,
            paymentStatus: paid
              ? CustomerOrderPaymentStatus.PAID
              : CustomerOrderPaymentStatus.CANCELLED,
            loyaltyPointsRedeemed: index % 5 === 0 ? 120 : 0,
            loyaltyPointsEarned: paid ? Math.round(estimatedTotal / 100) : 0,
            note: 'Branch compare demo pickup order',
            items: [
              {
                productId: product.id,
                quantity,
                unitPriceSnapshot: Number(product.sellingPrice),
              },
            ],
          }),
        );
        await this.customerOrderRepository
          .createQueryBuilder()
          .update(CustomerOrder)
          .set({ createdAt: orderDate })
          .where('id = :id', { id: order.id })
          .execute();
        savedOrders.push({ ...order, branchId: profile.branch.id });
        createdCount++;
      }
    }
    this.logger.log(
      `Branch comparison customer pickup orders ready (${createdCount} created).`,
    );
    return this.groupOrderIdsByBranch(savedOrders);
  }

  private async ensureBranchComparisonLoyalty(
    profiles: BranchComparisonSeedProfile[],
    orderIdsByBranch: Map<string, string[]>,
  ): Promise<void> {
    let createdCount = 0;
    for (const profile of profiles) {
      const members = await Promise.all(
        [1, 2, 3].map((index) => this.ensureDemoLoyaltyMember(profile, index)),
      );
      const orderIds = orderIdsByBranch.get(profile.branch.id) ?? [];

      for (let index = 0; index < members.length; index++) {
        const member = members[index];
        const earnedPoints = Math.round(
          (180 + index * 70) * profile.loyaltyScale,
        );
        const redeemedPoints = Math.round(
          (40 + index * 20) * profile.loyaltyScale,
        );
        if (
          await this.createDemoLoyaltyEntry({
            member,
            branchId: profile.branch.id,
            orderId: null,
            type: LoyaltyLedgerEntryType.EARNED,
            points: earnedPoints,
            description: `Branch compare demo: ${profile.code} POS earn ${index + 1}`,
            createdAt: this.branchComparisonDate(6 - index, 13 + index),
          })
        ) {
          createdCount++;
        }
        if (
          await this.createDemoLoyaltyEntry({
            member,
            branchId: profile.branch.id,
            orderId: orderIds[index % Math.max(orderIds.length, 1)] ?? null,
            type: LoyaltyLedgerEntryType.EARNED,
            points: Math.round(earnedPoints * 0.7),
            description: `Branch compare demo: ${profile.code} online earn ${index + 1}`,
            createdAt: this.branchComparisonDate(5 - index, 14 + index),
          })
        ) {
          createdCount++;
        }
        if (index < 2) {
          if (
            await this.createDemoLoyaltyEntry({
              member,
              branchId: profile.branch.id,
              orderId:
                orderIds[(index + 2) % Math.max(orderIds.length, 1)] ?? null,
              type: LoyaltyLedgerEntryType.REDEEMED,
              points: redeemedPoints,
              description: `Branch compare demo: ${profile.code} redeem ${index + 1}`,
              createdAt: this.branchComparisonDate(3 - index, 15 + index),
            })
          ) {
            createdCount++;
          }
        }
      }

      if (
        await this.createDemoLoyaltyEntry({
          member: members[0],
          branchId: profile.branch.id,
          orderId: null,
          type: LoyaltyLedgerEntryType.EARN_REVERSED,
          points: Math.round(25 * profile.loyaltyScale),
          description: `Branch compare demo: ${profile.code} reversal`,
          createdAt: this.branchComparisonDate(1, 16),
        })
      ) {
        createdCount++;
      }
    }

    this.logger.log(
      `Branch comparison loyalty movements ready (${createdCount} created).`,
    );
  }

  private async ensureDemoLoyaltyMember(
    profile: BranchComparisonSeedProfile,
    index: number,
  ): Promise<LoyaltyCustomer> {
    const phone = `+9477${profile.code === 'MAIN' ? '10' : profile.code === 'DOWN' ? '20' : '30'}00${index}`;
    let customer = await this.loyaltyCustomerRepository.findOne({
      where: { phone },
    });
    if (!customer) {
      customer = await this.loyaltyCustomerRepository.save(
        this.loyaltyCustomerRepository.create({
          phone,
          firstName: `${profile.code} Member ${index}`,
          lastName: 'Demo',
        }),
      );
    }

    let account = await this.loyaltyAccountRepository.findOne({
      where: { loyaltyCustomerId: customer.id },
    });
    const pointsBalance = Math.round(
      (900 + index * 850) * profile.loyaltyScale,
    );
    const lifetimePointsEarned = Math.round(
      (1200 + index * 1700) * profile.loyaltyScale,
    );
    if (!account) {
      account = this.loyaltyAccountRepository.create({
        loyaltyCustomerId: customer.id,
        userId: null,
      });
    }
    account.pointsBalance = pointsBalance;
    account.lifetimePointsEarned = lifetimePointsEarned;
    account.lifetimePointsRedeemed = Math.round(pointsBalance * 0.28);
    await this.loyaltyAccountRepository.save(account);
    return customer;
  }

  private async createDemoLoyaltyEntry(data: {
    member: LoyaltyCustomer;
    branchId: string;
    orderId: string | null;
    type: LoyaltyLedgerEntryType;
    points: number;
    description: string;
    createdAt: Date;
  }): Promise<boolean> {
    const existing = await this.loyaltyLedgerRepository.findOne({
      where: { description: data.description },
    });
    if (existing) return false;

    const entry = await this.loyaltyLedgerRepository.save(
      this.loyaltyLedgerRepository.create({
        loyaltyCustomerId: data.member.id,
        userId: null,
        branchId: data.branchId,
        orderId: data.orderId,
        type: data.type,
        points: data.points,
        description: data.description,
        metadata: { seed: 'branch-comparison' },
      }),
    );
    await this.loyaltyLedgerRepository
      .createQueryBuilder()
      .update(LoyaltyLedgerEntry)
      .set({ createdAt: data.createdAt })
      .where('id = :id', { id: entry.id })
      .execute();
    return true;
  }

  private groupOrderIdsByBranch(
    orders: CustomerOrder[],
  ): Map<string, string[]> {
    const grouped = new Map<string, string[]>();
    for (const order of orders) {
      const rows = grouped.get(order.branchId) ?? [];
      rows.push(order.id);
      grouped.set(order.branchId, rows);
    }
    return grouped;
  }

  private branchComparisonDate(daysAgo: number, hour: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, (daysAgo * 9 + hour) % 60, 0, 0);
    return date;
  }

  private demoQuantity(product: Product, seed: number): number {
    const baseUnit = product.baseUnit.toLowerCase();
    if (baseUnit === 'kg') {
      const quantities = [0.25, 0.5, 0.75, 1, 1.25, 1.5];
      return quantities[seed % quantities.length];
    }
    if (baseUnit === 'l') {
      const quantities = [0.25, 0.5, 0.75, 1, 1.5, 2];
      return quantities[seed % quantities.length];
    }
    return 1 + (seed % 4);
  }

  private legacyPaymentMethod(method: PosPaymentMethod): PaymentMethod {
    switch (method) {
      case 'Cash':
        return PaymentMethod.CASH;
      case 'Card':
        return PaymentMethod.CARD;
      case 'Mobile':
        return PaymentMethod.MOBILE;
      case 'Cheque':
      case 'Bank':
      case 'Credit':
        return PaymentMethod.ONLINE;
      default: {
        const exhaustive: never = method;
        return exhaustive;
      }
    }
  }

  private demoPaymentAmounts(
    method: PosPaymentMethod,
    total: number,
  ): Partial<Payment> {
    const roundedTotal = Math.round(total * 100) / 100;
    switch (method) {
      case 'Cash': {
        const cashTendered = Math.ceil(roundedTotal / 100) * 100;
        return {
          cashAmount: roundedTotal,
          cashTendered,
          cashChange: Math.round((cashTendered - roundedTotal) * 100) / 100,
        };
      }
      case 'Cheque':
        return {
          chequeAmount: roundedTotal,
          chequeNo: `CHQ-${Math.round(roundedTotal * 10)}`,
          chequeDate: this.branchComparisonDate(0, 12),
          chequeBank: 'Demo Bank',
          chequeBranch: 'Colombo',
        };
      case 'Bank':
        return {
          bankTransferAmount: roundedTotal,
          bankRef: `BANK-${Math.round(roundedTotal * 10)}`,
        };
      case 'Credit':
        return { creditAmount: roundedTotal };
      case 'Card':
      case 'Mobile':
        return {};
      default: {
        const exhaustive: never = method;
        return exhaustive;
      }
    }
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

  // ── Sales returns ──────────────────────────────────────

  /**
   * Seed `SalesReturn` rows (Phase C3) against the POS sales created by
   * `ensureTransactions`, so the returns report has data on a fresh DB. Each
   * restocked line writes a `Return` `StockMovement` and every return posts a
   * refund DEBIT ledger entry, mirroring the per-unit math in
   * `returns.service.ts`. Purely additive — the restock is treated as already
   * reflected in the seeded `inventory.quantity`, so on-hand totals are left
   * untouched. Idempotent via a count-check.
   *
   * Must run after `ensureLedgerAndExpenses`: that seed short-circuits on a
   * global `ledger_entries` count, so writing the refund rows earlier would
   * suppress the entire ledger/expense seed.
   */
  private async ensureSalesReturns(
    branches: { branch: Branch; cashier: User }[],
  ): Promise<void> {
    if ((await this.salesReturnRepository.count()) > 0) return;

    const round2 = (n: number): number => Math.round(n * 100) / 100;
    const round3 = (n: number): number => Math.round(n * 1000) / 1000;

    const reasons = [
      'Damaged on arrival',
      'Wrong item picked',
      'Customer changed their mind',
      'Expired before use',
    ];

    let createdReturns = 0;
    let createdItems = 0;

    for (const { branch, cashier } of branches) {
      const sales = await this.transactionRepository.find({
        where: { cashierId: cashier.id, branchId: branch.id },
        relations: ['items'],
        order: { createdAt: 'DESC' },
        take: 6,
      });

      let madeForBranch = 0;
      for (const sale of sales) {
        if (madeForBranch >= 3) break;
        const candidates = (sale.items ?? []).filter(
          (it) => Number(it.quantity) > 0,
        );
        if (candidates.length === 0) continue;

        // Return the first 1–2 lines of this sale at a partial quantity.
        const lineCount = Math.min(candidates.length, 1 + (madeForBranch % 2));
        const items: SalesReturnItem[] = [];
        let totalRefund = 0;
        let restockedValue = 0;

        for (let li = 0; li < lineCount; li += 1) {
          const item = candidates[li];
          const soldQty = Number(item.quantity);
          const perUnitBase =
            soldQty > 0 ? Number(item.baseUnitQty) / soldQty : 0;
          const perUnitRefund =
            soldQty > 0 ? Number(item.lineTotal) / soldQty : 0;

          // Whole-unit lines return one unit (plus one scrapped when there is
          // headroom); weight/volume lines return half. Keeps good + bad ≤ sold.
          const whole = Number.isInteger(soldQty);
          let goodQuantity: number;
          let badQuantity = 0;
          if (whole) {
            goodQuantity = 1;
            if (soldQty >= 3) badQuantity = 1;
          } else {
            goodQuantity = round3(soldQty * 0.5);
          }

          // For variety, the first line of every second branch-return is a
          // non-restock (e.g. opened packaging): refunded but not put back.
          const restockGood = !(madeForBranch === 1 && li === 0);
          const willRestock = restockGood && goodQuantity > 0;
          const baseUnitQtyGood = willRestock
            ? round3(goodQuantity * perUnitBase)
            : 0;
          const requested = round3(goodQuantity + badQuantity);
          const refundAmount = round2(requested * perUnitRefund);
          totalRefund = round2(totalRefund + refundAmount);
          if (willRestock) {
            restockedValue = round2(
              restockedValue + round2(goodQuantity * perUnitRefund),
            );
          }

          const ri = new SalesReturnItem();
          ri.saleItemId = item.id;
          ri.productId = item.productId;
          ri.goodQuantity = goodQuantity;
          ri.badQuantity = badQuantity;
          ri.baseUnitQtyGood = baseUnitQtyGood;
          ri.restockGood = restockGood;
          ri.refundAmount = refundAmount;
          items.push(ri);
        }

        if (items.length === 0) continue;

        const createdAt = new Date(sale.createdAt.getTime() + 2 * 3_600_000);
        const savedReturn = await this.salesReturnRepository.save(
          this.salesReturnRepository.create({
            saleId: sale.id,
            invoiceNumber: sale.invoiceNumber,
            branchId: sale.branchId,
            customerUserId: sale.customerUserId,
            totalRefundAmount: totalRefund,
            restockedValue,
            reason: reasons[createdReturns % reasons.length],
            status: 'Completed',
            createdByUserId: cashier.id,
            items,
          }),
        );
        await this.salesReturnRepository
          .createQueryBuilder()
          .update(SalesReturn)
          .set({ createdAt })
          .where('id = :id', { id: savedReturn.id })
          .execute();

        // Audit trail: a `Return` movement per restocked line (inventory itself
        // is left untouched — balanceAfter is a point-in-time figure) and a
        // single refund DEBIT ledger entry for the whole return.
        for (const ri of items) {
          if (!ri.restockGood || ri.baseUnitQtyGood <= 0) continue;
          const inv = await this.inventoryRepository.findOne({
            where: { productId: ri.productId, branchId: sale.branchId },
          });
          const balanceAfter = round3(
            (inv ? Number(inv.quantity) : 0) + ri.baseUnitQtyGood,
          );
          const movement = await this.stockMovementRepository.save(
            this.stockMovementRepository.create({
              productId: ri.productId,
              branchId: sale.branchId,
              location: sale.location,
              movementType: 'Return',
              qtyIn: ri.baseUnitQtyGood,
              qtyOut: 0,
              balanceAfter,
              refType: 'SalesReturn',
              refId: savedReturn.id,
              notes: `Return ${sale.invoiceNumber}`,
              createdByUserId: cashier.id,
            }),
          );
          await this.stockMovementRepository
            .createQueryBuilder()
            .update(StockMovement)
            .set({ createdAt })
            .where('id = :id', { id: movement.id })
            .execute();
        }

        if (totalRefund > 0) {
          const ledger = await this.ledgerRepository.save(
            this.ledgerRepository.create({
              branchId: sale.branchId,
              entryType: LedgerEntryType.DEBIT,
              amount: totalRefund,
              description: `Sales Return — ${sale.invoiceNumber}`,
              referenceNumber: `RET-${savedReturn.id.slice(0, 8).toUpperCase()}`,
              saleId: sale.id,
            }),
          );
          await this.ledgerRepository
            .createQueryBuilder()
            .update(LedgerEntry)
            .set({ createdAt })
            .where('id = :id', { id: ledger.id })
            .execute();
        }

        madeForBranch += 1;
        createdReturns += 1;
        createdItems += items.length;
      }
    }

    if (createdReturns > 0) {
      this.logger.log(
        `Sales returns seeded (${createdReturns} returns, ${createdItems} items).`,
      );
    }
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
