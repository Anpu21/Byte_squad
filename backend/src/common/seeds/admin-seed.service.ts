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
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    this.logger.log('Running database seed...');
    const defaults = this.getSeedDefaults();

    // 1. Branches
    const mainBranch = await this.ensureBranch(
      defaults.branchName,
      defaults.branchAddress,
      defaults.branchPhone,
    );
    const downtownBranch = await this.ensureBranch(
      'Downtown Branch',
      '45 Commerce Street, Downtown',
      '+94112345678',
    );

    // 2. Users
    await this.ensureUser({
      email: 'superadmin@ledgerpro.com',
      password: 'Super@123',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      branchId: mainBranch.id,
    });

    const admin = await this.ensureUser({
      email: defaults.adminEmail,
      password: defaults.adminPassword,
      firstName: defaults.adminFirstName,
      lastName: defaults.adminLastName,
      role: UserRole.ADMIN,
      branchId: mainBranch.id,
    });

    await this.ensureUser({
      email: 'admin2@ledgerpro.com',
      password: 'Admin@123',
      firstName: 'Downtown',
      lastName: 'Admin',
      role: UserRole.ADMIN,
      branchId: downtownBranch.id,
    });

    await this.ensureUser({
      email: 'manager@ledgerpro.com',
      password: 'Manager@123',
      firstName: 'Sarah',
      lastName: 'Connor',
      role: UserRole.MANAGER,
      branchId: downtownBranch.id,
    });

    const accountant = await this.ensureUser({
      email: 'accountant@ledgerpro.com',
      password: 'Account@123',
      firstName: 'Mike',
      lastName: 'Ross',
      role: UserRole.ACCOUNTANT,
      branchId: mainBranch.id,
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

    // 3. Products
    const products = await this.ensureProducts();

    // 4. Inventory
    await this.ensureInventory(products, mainBranch.id);
    await this.ensureInventory(products, downtownBranch.id);

    // 5. Transactions (dummy sales data for last 7 days)
    await this.ensureTransactions(cashier1, mainBranch.id, products);
    await this.ensureTransactions(cashier2, downtownBranch.id, products);

    // 6. Ledger entries & expenses
    await this.ensureLedgerAndExpenses(
      mainBranch.id,
      downtownBranch.id,
      accountant.id,
    );

    // 7. Notifications
    await this.ensureNotifications([admin, cashier1, cashier2, accountant]);

    this.logger.log('Database seed completed.');
  }

  // ── Branch ─────────────────────────────────────────────

  private async ensureBranch(
    name: string,
    address: string,
    phone: string,
  ): Promise<Branch> {
    let branch = await this.branchRepository.findOne({ where: { name } });
    if (!branch) {
      branch = await this.branchRepository.save(
        this.branchRepository.create({ name, address, phone, isActive: true }),
      );
      this.logger.log(`Branch "${name}" created.`);
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
    branchId: string;
  }): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (user) {
      // Fix first-login flag for seeded users
      if (user.isFirstLogin) {
        await this.userRepository.update(user.id, { isFirstLogin: false });
        user.isFirstLogin = false;
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
    const existingCount = await this.productRepository.count();
    if (existingCount > 0) {
      return this.productRepository.find();
    }

    const productData = [
      {
        name: 'Wireless Mouse',
        barcode: 'PRD-001',
        category: 'Electronics',
        costPrice: 8.5,
        sellingPrice: 14.99,
        description: 'Ergonomic wireless mouse',
      },
      {
        name: 'USB-C Hub',
        barcode: 'PRD-002',
        category: 'Electronics',
        costPrice: 15.0,
        sellingPrice: 29.99,
        description: '7-in-1 USB-C hub',
      },
      {
        name: 'Mechanical Keyboard',
        barcode: 'PRD-003',
        category: 'Electronics',
        costPrice: 35.0,
        sellingPrice: 69.99,
        description: 'RGB mechanical keyboard',
      },
      {
        name: 'Monitor Stand',
        barcode: 'PRD-004',
        category: 'Furniture',
        costPrice: 12.0,
        sellingPrice: 24.99,
        description: 'Adjustable monitor stand',
      },
      {
        name: 'Desk Lamp',
        barcode: 'PRD-005',
        category: 'Furniture',
        costPrice: 10.0,
        sellingPrice: 19.99,
        description: 'LED desk lamp',
      },
      {
        name: 'Webcam HD',
        barcode: 'PRD-006',
        category: 'Electronics',
        costPrice: 18.0,
        sellingPrice: 39.99,
        description: '1080p HD webcam',
      },
      {
        name: 'Headphones',
        barcode: 'PRD-007',
        category: 'Electronics',
        costPrice: 22.0,
        sellingPrice: 49.99,
        description: 'Noise-cancelling headphones',
      },
      {
        name: 'Notebook A5',
        barcode: 'PRD-008',
        category: 'Stationery',
        costPrice: 1.5,
        sellingPrice: 4.99,
        description: 'A5 lined notebook',
      },
      {
        name: 'Pen Pack (10)',
        barcode: 'PRD-009',
        category: 'Stationery',
        costPrice: 2.0,
        sellingPrice: 6.99,
        description: 'Pack of 10 ballpoint pens',
      },
      {
        name: 'Cable Organizer',
        barcode: 'PRD-010',
        category: 'Accessories',
        costPrice: 3.0,
        sellingPrice: 9.99,
        description: 'Silicone cable organizer',
      },
      {
        name: 'Mouse Pad XL',
        barcode: 'PRD-011',
        category: 'Accessories',
        costPrice: 5.0,
        sellingPrice: 12.99,
        description: 'Extra large mouse pad',
      },
      {
        name: 'Phone Holder',
        barcode: 'PRD-012',
        category: 'Accessories',
        costPrice: 4.0,
        sellingPrice: 11.99,
        description: 'Adjustable phone holder',
      },
      {
        name: 'USB Flash Drive 64GB',
        barcode: 'PRD-013',
        category: 'Electronics',
        costPrice: 6.0,
        sellingPrice: 14.99,
        description: '64GB USB 3.0 flash drive',
      },
      {
        name: 'Laptop Sleeve 15"',
        barcode: 'PRD-014',
        category: 'Accessories',
        costPrice: 8.0,
        sellingPrice: 19.99,
        description: '15-inch laptop sleeve',
      },
      {
        name: 'Screen Cleaner Kit',
        barcode: 'PRD-015',
        category: 'Accessories',
        costPrice: 3.5,
        sellingPrice: 8.99,
        description: 'Screen cleaning spray + cloth',
      },
    ];

    const products: Product[] = [];
    for (const p of productData) {
      const product = await this.productRepository.save(
        this.productRepository.create({
          ...p,
          isActive: true,
        }),
      );
      products.push(product);
    }
    this.logger.log(`${products.length} products created.`);
    return products;
  }

  // ── Inventory ──────────────────────────────────────────

  private async ensureInventory(
    products: Product[],
    branchId: string,
  ): Promise<void> {
    for (const product of products) {
      const existing = await this.inventoryRepository.findOne({
        where: { productId: product.id, branchId },
      });
      if (!existing) {
        const quantity = Math.floor(Math.random() * 150) + 10;
        const lowThreshold = product.category === 'Stationery' ? 20 : 10;
        await this.inventoryRepository.save(
          this.inventoryRepository.create({
            productId: product.id,
            branchId,
            quantity,
            lowStockThreshold: lowThreshold,
            lastRestockedAt: new Date(),
          }),
        );
      }
    }
    this.logger.log(`Inventory seeded for branch ${branchId}.`);
  }

  // ── Transactions ───────────────────────────────────────

  private async ensureTransactions(
    cashier: User,
    branchId: string,
    products: Product[],
  ): Promise<void> {
    // Check if transactions already exist for this cashier
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

    // Create transactions for the last 7 days
    for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
      // 3-8 transactions per day
      const txnCount = Math.floor(Math.random() * 6) + 3;

      for (let t = 0; t < txnCount; t++) {
        const txnDate = new Date(now);
        txnDate.setDate(txnDate.getDate() - daysAgo);
        txnDate.setHours(
          8 + Math.floor(Math.random() * 10),
          Math.floor(Math.random() * 60),
          Math.floor(Math.random() * 60),
        );

        // 1-4 items per transaction
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

        // Manually set createdAt for historical data
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
    accountantId: string,
  ): Promise<void> {
    const ledgerCount = await this.ledgerRepository.count();
    if (ledgerCount > 0) return;

    const now = new Date();

    // Ledger entries
    const ledgerData = [
      {
        branchId: mainBranchId,
        entryType: LedgerEntryType.CREDIT,
        amount: 4500.0,
        description: 'Daily sales revenue',
        referenceNumber: 'LED-001',
      },
      {
        branchId: mainBranchId,
        entryType: LedgerEntryType.DEBIT,
        amount: 1200.0,
        description: 'Inventory restock payment',
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
        description: 'Office supplies purchase',
        referenceNumber: 'LED-004',
      },
      {
        branchId: downtownBranchId,
        entryType: LedgerEntryType.CREDIT,
        amount: 3200.0,
        description: 'Daily sales revenue',
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
    ];

    for (const entry of ledgerData) {
      await this.ledgerRepository.save(this.ledgerRepository.create(entry));
    }

    // Expenses
    const expenseData = [
      {
        branchId: mainBranchId,
        createdBy: accountantId,
        category: 'Rent',
        amount: 2500.0,
        description: 'Monthly office rent',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 1),
      },
      {
        branchId: mainBranchId,
        createdBy: accountantId,
        category: 'Utilities',
        amount: 350.0,
        description: 'Electricity bill',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 5),
      },
      {
        branchId: mainBranchId,
        createdBy: accountantId,
        category: 'Supplies',
        amount: 180.0,
        description: 'Cleaning supplies',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 8),
      },
      {
        branchId: downtownBranchId,
        createdBy: accountantId,
        category: 'Rent',
        amount: 1800.0,
        description: 'Monthly shop rent',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 1),
      },
      {
        branchId: downtownBranchId,
        createdBy: accountantId,
        category: 'Marketing',
        amount: 450.0,
        description: 'Social media ads',
        expenseDate: new Date(now.getFullYear(), now.getMonth(), 10),
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
      // users: [admin, cashier1, cashier2, accountant]
    }[] = [
      // Admin notifications
      {
        userId: users[0].id,
        title: 'Low Stock Alert',
        message: 'Wireless Mouse stock is below threshold (5 remaining)',
        type: NotificationType.LOW_STOCK,
        isRead: false,
        hoursAgo: 1,
      },
      {
        userId: users[0].id,
        title: 'New User Created',
        message: 'Cashier account cashier2@ledgerpro.com has been created',
        type: NotificationType.SYSTEM,
        isRead: true,
        hoursAgo: 12,
      },
      {
        userId: users[0].id,
        title: 'Low Stock Alert',
        message: 'Notebook A5 stock is critically low (3 remaining)',
        type: NotificationType.LOW_STOCK,
        isRead: false,
        hoursAgo: 3,
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
      // Cashier 1 notifications
      {
        userId: users[1].id,
        title: 'Low Stock Alert',
        message: 'USB-C Hub stock is below threshold (8 remaining)',
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
      // Cashier 2 notifications
      {
        userId: users[2].id,
        title: 'Daily Report Ready',
        message: 'Your daily sales report for yesterday is now available',
        type: NotificationType.SYSTEM,
        isRead: false,
        hoursAgo: 8,
      },
      // Accountant notifications
      {
        userId: users[3].id,
        title: 'Expense Approved',
        message: 'Monthly office rent expense has been approved',
        type: NotificationType.SYSTEM,
        isRead: true,
        hoursAgo: 48,
      },
      {
        userId: users[3].id,
        title: 'Low Stock Alert',
        message: 'Pen Pack (10) stock is below threshold (7 remaining)',
        type: NotificationType.LOW_STOCK,
        isRead: false,
        hoursAgo: 4,
      },
    ];

    for (const n of notificationData) {
      const createdAt = new Date(now);
      createdAt.setHours(createdAt.getHours() - n.hoursAgo);

      const notification = this.notificationRepository.create({
        userId: n.userId,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.isRead,
      });

      const saved = await this.notificationRepository.save(notification);

      await this.notificationRepository
        .createQueryBuilder()
        .update(Notification)
        .set({ createdAt })
        .where('id = :id', { id: saved.id })
        .execute();
    }

    this.logger.log('Notifications seeded.');
  }

  // ── Helpers ────────────────────────────────────────────

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
