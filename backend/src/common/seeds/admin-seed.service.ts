import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { Product } from '@products/entities/product.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { Transaction } from '@pos/entities/transaction.entity';
import { TransactionItem } from '@pos/entities/transaction-item.entity';
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

interface SeedDefaults {
  adminEmail: string;
  adminPassword: string;
  adminFirstName: string;
  adminLastName: string;
  branchName: string;
  branchAddress: string;
  branchPhone: string;
}

interface SupermarketProductSeed {
  name: string;
  barcode: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  description: string;
}

const SUPERMARKET_PRODUCTS: SupermarketProductSeed[] = [
  {
    name: 'Coca-Cola 1.5L',
    barcode: 'BVG-001',
    category: 'Beverages',
    costPrice: 315,
    sellingPrice: 420,
    description: 'Classic Coca-Cola, 1.5 litre bottle',
  },
  {
    name: 'Pepsi 1.5L',
    barcode: 'BVG-002',
    category: 'Beverages',
    costPrice: 315,
    sellingPrice: 420,
    description: 'Pepsi cola, 1.5 litre bottle',
  },
  {
    name: 'Sprite 1.5L',
    barcode: 'BVG-003',
    category: 'Beverages',
    costPrice: 315,
    sellingPrice: 420,
    description: 'Sprite lemon-lime, 1.5 litre bottle',
  },
  {
    name: 'Orange Juice 1L',
    barcode: 'BVG-004',
    category: 'Beverages',
    costPrice: 840,
    sellingPrice: 1050,
    description: '100% pure orange juice, 1 litre',
  },
  {
    name: 'Bottled Water 1.5L',
    barcode: 'BVG-005',
    category: 'Beverages',
    costPrice: 100,
    sellingPrice: 130,
    description: 'Spring water, 1.5 litre',
  },
  {
    name: 'Tea Bags (100)',
    barcode: 'BVG-006',
    category: 'Beverages',
    costPrice: 600,
    sellingPrice: 790,
    description: 'Black tea, 100 bags',
  },
  {
    name: 'Instant Coffee 100g',
    barcode: 'BVG-007',
    category: 'Beverages',
    costPrice: 1320,
    sellingPrice: 1660,
    description: 'Instant coffee jar, 100g',
  },
  {
    name: 'Whole Milk 1L',
    barcode: 'DRY-001',
    category: 'Dairy',
    costPrice: 440,
    sellingPrice: 550,
    description: 'Fresh whole milk, 1 litre',
  },
  {
    name: 'Low-Fat Milk 1L',
    barcode: 'DRY-002',
    category: 'Dairy',
    costPrice: 416,
    sellingPrice: 520,
    description: 'Low-fat milk, 1 litre',
  },
  {
    name: 'Plain Yogurt 250g',
    barcode: 'DRY-003',
    category: 'Dairy',
    costPrice: 175,
    sellingPrice: 230,
    description: 'Plain yogurt, 250g cup',
  },
  {
    name: 'Salted Butter 250g',
    barcode: 'DRY-004',
    category: 'Dairy',
    costPrice: 960,
    sellingPrice: 1200,
    description: 'Salted butter block, 250g',
  },
  {
    name: 'Cheddar Cheese 200g',
    barcode: 'DRY-005',
    category: 'Dairy',
    costPrice: 840,
    sellingPrice: 1050,
    description: 'Cheddar cheese block, 200g',
  },
  {
    name: 'Eggs (12)',
    barcode: 'DRY-006',
    category: 'Dairy',
    costPrice: 540,
    sellingPrice: 660,
    description: 'Free-range eggs, dozen',
  },
  {
    name: 'White Bread Loaf',
    barcode: 'BKY-001',
    category: 'Bakery',
    costPrice: 340,
    sellingPrice: 450,
    description: 'Fresh white bread loaf, 700g',
  },
  {
    name: 'Brown Bread Loaf',
    barcode: 'BKY-002',
    category: 'Bakery',
    costPrice: 390,
    sellingPrice: 520,
    description: 'Whole-wheat brown bread, 700g',
  },
  {
    name: 'Burger Buns (6)',
    barcode: 'BKY-003',
    category: 'Bakery',
    costPrice: 360,
    sellingPrice: 480,
    description: 'Soft burger buns, pack of 6',
  },
  {
    name: 'Dinner Rolls (8)',
    barcode: 'BKY-004',
    category: 'Bakery',
    costPrice: 270,
    sellingPrice: 360,
    description: 'Dinner rolls, pack of 8',
  },
  {
    name: 'Apples 1kg',
    barcode: 'PRD-001',
    category: 'Produce',
    costPrice: 800,
    sellingPrice: 1000,
    description: 'Red apples, 1kg',
  },
  {
    name: 'Bananas 1kg',
    barcode: 'PRD-002',
    category: 'Produce',
    costPrice: 120,
    sellingPrice: 170,
    description: 'Cavendish bananas, 1kg',
  },
  {
    name: 'Tomatoes 1kg',
    barcode: 'PRD-003',
    category: 'Produce',
    costPrice: 350,
    sellingPrice: 490,
    description: 'Fresh tomatoes, 1kg',
  },
  {
    name: 'Onions 1kg',
    barcode: 'PRD-004',
    category: 'Produce',
    costPrice: 180,
    sellingPrice: 260,
    description: 'Yellow onions, 1kg',
  },
  {
    name: 'Potatoes 2kg',
    barcode: 'PRD-005',
    category: 'Produce',
    costPrice: 500,
    sellingPrice: 640,
    description: 'Potatoes, 2kg bag',
  },
  {
    name: 'Carrots 1kg',
    barcode: 'PRD-006',
    category: 'Produce',
    costPrice: 270,
    sellingPrice: 360,
    description: 'Fresh carrots, 1kg',
  },
  {
    name: 'Basmati Rice 5kg',
    barcode: 'PNT-001',
    category: 'Pantry',
    costPrice: 4500,
    sellingPrice: 5500,
    description: 'Premium basmati rice, 5kg',
  },
  {
    name: 'Sugar 1kg',
    barcode: 'PNT-002',
    category: 'Pantry',
    costPrice: 220,
    sellingPrice: 295,
    description: 'White granulated sugar, 1kg',
  },
  {
    name: 'Iodized Salt 1kg',
    barcode: 'PNT-003',
    category: 'Pantry',
    costPrice: 240,
    sellingPrice: 315,
    description: 'Iodized table salt, 1kg',
  },
  {
    name: 'All-Purpose Flour 2kg',
    barcode: 'PNT-004',
    category: 'Pantry',
    costPrice: 360,
    sellingPrice: 490,
    description: 'All-purpose wheat flour, 2kg',
  },
  {
    name: 'Spaghetti Pasta 500g',
    barcode: 'PNT-005',
    category: 'Pantry',
    costPrice: 780,
    sellingPrice: 1000,
    description: 'Spaghetti pasta, 500g',
  },
  {
    name: 'Red Lentils 1kg',
    barcode: 'PNT-006',
    category: 'Pantry',
    costPrice: 220,
    sellingPrice: 280,
    description: 'Red lentils, 1kg',
  },
  {
    name: 'Sunflower Oil 1L',
    barcode: 'PNT-007',
    category: 'Pantry',
    costPrice: 1550,
    sellingPrice: 1925,
    description: 'Sunflower vegetable oil, 1 litre',
  },
  {
    name: 'Potato Chips 150g',
    barcode: 'SNK-001',
    category: 'Snacks',
    costPrice: 290,
    sellingPrice: 390,
    description: 'Salted potato chips, 150g',
  },
  {
    name: 'Chocolate Cookies 200g',
    barcode: 'SNK-002',
    category: 'Snacks',
    costPrice: 600,
    sellingPrice: 780,
    description: 'Chocolate chip cookies, 200g',
  },
  {
    name: 'Milk Chocolate Bar 100g',
    barcode: 'SNK-003',
    category: 'Snacks',
    costPrice: 375,
    sellingPrice: 500,
    description: 'Milk chocolate bar, 100g',
  },
  {
    name: 'Salted Crackers 200g',
    barcode: 'SNK-004',
    category: 'Snacks',
    costPrice: 160,
    sellingPrice: 210,
    description: 'Salted crackers, 200g',
  },
  {
    name: 'Mixed Nuts 250g',
    barcode: 'SNK-005',
    category: 'Snacks',
    costPrice: 950,
    sellingPrice: 1250,
    description: 'Roasted mixed nuts, 250g',
  },
  {
    name: 'Frozen Chicken 1kg',
    barcode: 'FRZ-001',
    category: 'Frozen',
    costPrice: 1000,
    sellingPrice: 1250,
    description: 'Frozen chicken pieces, 1kg',
  },
  {
    name: 'Frozen Fish Fillet 500g',
    barcode: 'FRZ-002',
    category: 'Frozen',
    costPrice: 1750,
    sellingPrice: 2200,
    description: 'Frozen white fish fillet, 500g',
  },
  {
    name: 'Vanilla Ice Cream 1L',
    barcode: 'FRZ-003',
    category: 'Frozen',
    costPrice: 700,
    sellingPrice: 900,
    description: 'Vanilla ice cream, 1 litre',
  },
  {
    name: 'Dish Soap 500ml',
    barcode: 'HSH-001',
    category: 'Household',
    costPrice: 320,
    sellingPrice: 425,
    description: 'Lemon dish soap, 500ml',
  },
  {
    name: 'Laundry Detergent 1kg',
    barcode: 'HSH-002',
    category: 'Household',
    costPrice: 430,
    sellingPrice: 565,
    description: 'Powder laundry detergent, 1kg',
  },
  {
    name: 'Toilet Paper (12 rolls)',
    barcode: 'HSH-003',
    category: 'Household',
    costPrice: 2500,
    sellingPrice: 3180,
    description: 'Toilet paper, 12-roll pack',
  },
  {
    name: 'Floor Cleaner 1L',
    barcode: 'HSH-004',
    category: 'Household',
    costPrice: 530,
    sellingPrice: 700,
    description: 'Multi-surface floor cleaner, 1 litre',
  },
  {
    name: 'Shampoo 400ml',
    barcode: 'PCR-001',
    category: 'Personal Care',
    costPrice: 1150,
    sellingPrice: 1550,
    description: 'Anti-dandruff shampoo, 400ml',
  },
  {
    name: 'Bath Soap Bar',
    barcode: 'PCR-002',
    category: 'Personal Care',
    costPrice: 120,
    sellingPrice: 170,
    description: 'Moisturising bath soap, 100g',
  },
  {
    name: 'Toothpaste 100g',
    barcode: 'PCR-003',
    category: 'Personal Care',
    costPrice: 180,
    sellingPrice: 250,
    description: 'Mint fluoride toothpaste, 100g',
  },
  {
    name: 'Toothbrush',
    barcode: 'PCR-004',
    category: 'Personal Care',
    costPrice: 100,
    sellingPrice: 150,
    description: 'Soft-bristle toothbrush',
  },
];

const CATEGORY_THRESHOLDS: Record<string, number> = {
  Beverages: 30,
  Dairy: 30,
  Bakery: 25,
  Produce: 25,
  Pantry: 20,
  Snacks: 20,
  Frozen: 15,
  Household: 15,
  'Personal Care': 12,
};

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
    @InjectRepository(Inventory)
    private readonly inventoryRepository: Repository<Inventory>,
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepository: Repository<TransactionItem>,
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

    await this.ensureUser({
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
      }

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
      const quantity = this.generateQuantity(profile, threshold);
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

  // Healthy branches stock most items above threshold; "short" branches
  // (Suburban in this seed) intentionally have many low-stock and a few
  // out-of-stock items so the transfer flow has a natural starting point.
  private generateQuantity(
    profile: 'healthy' | 'short',
    threshold: number,
  ): number {
    const r = Math.random();
    if (profile === 'short') {
      if (r < 0.2) return 0;
      if (r < 0.55) return Math.floor(Math.random() * threshold);
      return Math.floor(Math.random() * 80) + threshold;
    }
    if (r < 0.05) return 0;
    if (r < 0.18) return Math.floor(Math.random() * threshold);
    return Math.floor(Math.random() * 150) + threshold;
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
        const items: Partial<TransactionItem>[] = [];
        for (const prod of selectedProducts) {
          const qty = Math.floor(Math.random() * 3) + 1;
          const lineTotal = Number(prod.sellingPrice) * qty;
          subtotal += lineTotal;
          items.push({
            productId: prod.id,
            quantity: qty,
            unitPrice: Number(prod.sellingPrice),
            discountAmount: 0,
            discountType: DiscountType.NONE,
            lineTotal,
          });
        }

        const total = Math.round(subtotal * 100) / 100;
        const txnNumber = `TXN-${txnDate.getTime()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const transaction = this.transactionRepository.create({
          transactionNumber: txnNumber,
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
          items: items as TransactionItem[],
        });

        const saved = await this.transactionRepository.save(transaction);
        await this.transactionRepository
          .createQueryBuilder()
          .update(Transaction)
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
