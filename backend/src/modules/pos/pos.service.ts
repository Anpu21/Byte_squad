import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Transaction } from '@pos/entities/transaction.entity.js';
import { CreateTransactionDto } from '@pos/dto/create-transaction.dto.js';

export interface DailyBreakdown {
  date: string;
  totalSales: number;
  transactionCount: number;
}

export interface CashierDashboardData {
  today: {
    totalSales: number;
    transactionCount: number;
    averageSale: number;
  };
  week: {
    totalSales: number;
    transactionCount: number;
  };
  dailyBreakdown: DailyBreakdown[];
  recentTransactions: Transaction[];
}

@Injectable()
export class PosService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) {}

  async createTransaction(
    dto: CreateTransactionDto,
    cashierId: string,
    branchId: string,
  ): Promise<Transaction> {
    const transactionNumber = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const transaction = this.transactionRepository.create({
      transactionNumber,
      branchId,
      cashierId,
      type: dto.type,
      subtotal: 0,
      discountAmount: dto.discountAmount ?? 0,
      discountType: dto.discountType,
      taxAmount: 0,
      total: 0,
      paymentMethod: dto.paymentMethod,
      items: dto.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount ?? 0,
        discountType: item.discountType,
        lineTotal: item.unitPrice * item.quantity - (item.discountAmount ?? 0),
      })),
    });

    return this.transactionRepository.save(transaction);
  }

  async findAll(branchId: string): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { branchId },
      relations: ['items', 'items.product', 'cashier'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.transactionRepository.findOne({
      where: { id },
      relations: ['items', 'items.product', 'cashier'],
    });
  }

  async getCashierDashboard(
    cashierId: string,
    branchId: string,
  ): Promise<CashierDashboardData> {
    const now = new Date();

    // Start of today (midnight)
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    // Start of 7 days ago
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    // Today's transactions for this cashier
    const todayTransactions = await this.transactionRepository.find({
      where: {
        cashierId,
        branchId,
        createdAt: MoreThanOrEqual(todayStart),
      },
    });

    const todayTotalSales = todayTransactions.reduce(
      (sum, t) => sum + Number(t.total),
      0,
    );
    const todayCount = todayTransactions.length;
    const todayAvg = todayCount > 0 ? todayTotalSales / todayCount : 0;

    // This week's transactions
    const weekTransactions = await this.transactionRepository.find({
      where: {
        cashierId,
        branchId,
        createdAt: MoreThanOrEqual(weekStart),
      },
    });

    const weekTotalSales = weekTransactions.reduce(
      (sum, t) => sum + Number(t.total),
      0,
    );

    // Daily breakdown for chart (last 7 days)
    const dailyMap = new Map<string, { totalSales: number; count: number }>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { totalSales: 0, count: 0 });
    }

    for (const t of weekTransactions) {
      const key = new Date(t.createdAt).toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.totalSales += Number(t.total);
        entry.count += 1;
      }
    }

    const dailyBreakdown: DailyBreakdown[] = [];
    for (const [date, data] of dailyMap) {
      dailyBreakdown.push({
        date,
        totalSales: Math.round(data.totalSales * 100) / 100,
        transactionCount: data.count,
      });
    }

    // Recent 10 transactions
    const recentTransactions = await this.transactionRepository.find({
      where: { cashierId, branchId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      today: {
        totalSales: Math.round(todayTotalSales * 100) / 100,
        transactionCount: todayCount,
        averageSale: Math.round(todayAvg * 100) / 100,
      },
      week: {
        totalSales: Math.round(weekTotalSales * 100) / 100,
        transactionCount: weekTransactions.length,
      },
      dailyBreakdown,
      recentTransactions,
    };
  }
}
