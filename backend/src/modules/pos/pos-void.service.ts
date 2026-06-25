import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { Sale } from '@pos/entities/sale.entity';
import { Inventory } from '@inventory/entities/inventory.entity';
import { User } from '@users/entities/user.entity';

import { SaleRepository } from '@pos/sale.repository';
import { PaymentRepository } from '@pos/payment.repository';
import { CreditTransactionRepository } from '@pos/credit-transaction.repository';
import { StockMovementRepository } from '@pos/stock-movement.repository';
import { AccountingService } from '@/modules/accounting-core/accounting.service';
import { LoyaltyWalletService } from '@/modules/loyalty-wallets/loyalty-wallet.service';

import { LedgerEntryType } from '@common/enums/ledger-entry.enum';
import { UserRole } from '@common/enums/user-roles.enums';
import type { CreditTransaction } from '@pos/entities/credit-transaction.entity';
import type { ActorPayload } from '@pos/pos-write.service';
import type { LoyaltyOwner } from '@/modules/loyalty-wallets/types';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * PosVoidService — owns the `POST /pos/sales/:id/void` reversal flow.
 *
 * Split from `pos-write.service.ts` (which owns the createSale path)
 * so each service stays inside the size budget from Rules.md §17.
 * Mirrors createSale step-for-step in the opposite direction: restock
 * inventory, write Sale_Voided audit rows, reverse credit
 * transactions, write a DEBIT ledger entry, void the Payment row,
 * and finally flip the Sale to Voided.
 *
 * Re-voiding throws ConflictException — that's the natural
 * idempotency for the endpoint.
 */
@Injectable()
export class PosVoidService {
  constructor(
    private readonly sales: SaleRepository,
    private readonly payments: PaymentRepository,
    private readonly creditTransactions: CreditTransactionRepository,
    private readonly stockMovements: StockMovementRepository,
    private readonly accounting: AccountingService,
    private readonly loyaltyWallet: LoyaltyWalletService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Reverse a completed sale atomically.
   *
   * Branch scope: cashiers cannot reach this endpoint (controller's
   * @Roles only lists ADMIN, MANAGER). For managers, cross-branch
   * targets return NotFoundException — never leak the existence of
   * sales rung up at other branches.
   *
   * Steps (all inside a single dataSource.transaction):
   *   1. Restock inventory (quantity += baseUnitQty per item).
   *   2. Insert Sale_Voided stock_movements rows.
   *   3. Reverse credit_transactions and customer.currentBalance.
   *   4. Write a DEBIT ledger entry equal to the original total.
   *   5. Flip the Payment row to status='Voided'.
   *   6. Update Sale with voidedReason/voidedAt/voidedByUserId and
   *      status='Voided'.
   */
  async voidSale(
    actor: ActorPayload,
    id: string,
    reason: string,
  ): Promise<Sale> {
    const existing = await this.sales.findOneById(id);
    if (!existing) {
      throw new NotFoundException('Sale not found');
    }
    if (existing.status === 'Voided') {
      throw new ConflictException('Sale is already voided');
    }
    if (actor.role !== UserRole.ADMIN && existing.branchId !== actor.branchId) {
      throw new NotFoundException('Sale not found');
    }

    await this.dataSource.transaction(async (manager) => {
      await this.restockInventory(manager, existing);
      await this.recordVoidStockMovements(manager, existing, actor.id, reason);
      await this.reverseCreditTransactions(manager, existing);
      await this.reverseLoyalty(manager, existing);
      await this.writeVoidLedgerEntry(manager, existing, reason);
      await this.payments.voidBySaleId(existing.id, manager);
      await this.sales.voidById(existing.id, actor.id, reason, manager);
    });

    const refreshed = await this.sales.findOneById(id);
    if (!refreshed) {
      throw new NotFoundException('Sale disappeared during void');
    }
    return refreshed;
  }

  /**
   * Re-credit inventory for every item on the voided sale. Skips rows
   * where the inventory record no longer exists (product retired
   * between the sale and the void) — the audit log row below still
   * records the reversal.
   */
  private async restockInventory(
    manager: EntityManager,
    sale: Sale,
  ): Promise<void> {
    const invRepo = manager.getRepository(Inventory);
    for (const item of sale.items ?? []) {
      const inv = await invRepo
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.product_id = :p AND i.branch_id = :b', {
          p: item.productId,
          b: sale.branchId,
        })
        .getOne();
      if (!inv) continue;
      inv.quantity = round3(Number(inv.quantity) + Number(item.baseUnitQty));
      await invRepo.save(inv);
    }
  }

  /**
   * Write one Sale_Voided stock_movements row per line item. Reads the
   * post-restore inventory balance via a follow-up findOne so the
   * audit row captures balanceAfter even when the inventory row was
   * absent during restock (we record 0 in that case).
   */
  private async recordVoidStockMovements(
    manager: EntityManager,
    sale: Sale,
    actorId: string,
    reason: string,
  ): Promise<void> {
    const invRepo = manager.getRepository(Inventory);
    for (const item of sale.items ?? []) {
      const inv = await invRepo.findOne({
        where: { productId: item.productId, branchId: sale.branchId },
      });
      await this.stockMovements.create(
        {
          productId: item.productId,
          branchId: sale.branchId,
          location: sale.location,
          movementType: 'Sale_Voided',
          qtyIn: Number(item.baseUnitQty),
          qtyOut: 0,
          balanceAfter: inv ? Number(inv.quantity) : 0,
          refType: 'Sale',
          refId: sale.id,
          notes: `Voided ${sale.invoiceNumber}: ${reason}`,
          createdByUserId: actorId,
        },
        manager,
      );
    }
  }

  /**
   * Reverse the original credit_transactions rows on a sale.
   * Credit_Taken (we extended store credit) → Credit_Paid (return it).
   * Credit_Paid (overpayment kept) → Credit_Taken (remove the kept
   * balance). User.currentBalance moves in lockstep.
   */
  private async reverseCreditTransactions(
    manager: EntityManager,
    sale: Sale,
  ): Promise<void> {
    const original = await this.creditTransactions.findBySaleId(sale.id);
    if (original.length === 0 || !sale.customerUserId) return;

    const user = await manager
      .getRepository(User)
      .findOne({ where: { id: sale.customerUserId } });
    if (!user) {
      // Customer deleted since the sale; still write reversing audit
      // rows so the credit_transactions trail balances out.
      await this.appendReversalTransactions(manager, sale, original, 0);
      return;
    }
    const finalBalance = await this.appendReversalTransactions(
      manager,
      sale,
      original,
      Number(user.currentBalance),
    );
    await manager
      .getRepository(User)
      .update(user.id, { currentBalance: finalBalance });
  }

  private async appendReversalTransactions(
    manager: EntityManager,
    sale: Sale,
    original: CreditTransaction[],
    startingBalance: number,
  ): Promise<number> {
    let runningBalance = startingBalance;
    for (const txn of original) {
      const amount = Number(txn.amount);
      const reverseType: 'Credit_Taken' | 'Credit_Paid' =
        txn.transactionType === 'Credit_Taken' ? 'Credit_Paid' : 'Credit_Taken';
      const delta = txn.transactionType === 'Credit_Taken' ? -amount : amount;
      runningBalance = round2(runningBalance + delta);
      await this.creditTransactions.create(
        {
          userId: txn.userId,
          saleId: sale.id,
          transactionType: reverseType,
          amount,
          runningBalance,
          referenceNo: `VOID-${sale.invoiceNumber}-${txn.id.slice(0, 6)}`,
          notes: `Reverse ${txn.transactionType} from voided invoice ${sale.invoiceNumber}`,
        },
        manager,
      );
    }
    return runningBalance;
  }

  private async reverseLoyalty(
    manager: EntityManager,
    sale: Sale,
  ): Promise<void> {
    const owner = this.resolveLoyaltyOwner(sale);
    await this.loyaltyWallet.reverseOrderEffects({
      owner,
      orderId: sale.id,
      orderCode: sale.invoiceNumber,
      branchId: sale.branchId,
      manager,
    });
  }

  private resolveLoyaltyOwner(sale: Sale): LoyaltyOwner | null {
    if (sale.customerUserId) return { userId: sale.customerUserId };
    if (sale.loyaltyCustomerId) {
      return { loyaltyCustomerId: sale.loyaltyCustomerId };
    }
    return null;
  }

  /**
   * Write a DEBIT ledger entry equal to the original sale total. The
   * original CREDIT entry (from createSale) plus this DEBIT net to
   * zero. Skips when total <= 0 — defensive against zero-total sales
   * that shouldn't have a ledger entry to begin with.
   */
  private async writeVoidLedgerEntry(
    manager: EntityManager,
    sale: Sale,
    reason: string,
  ): Promise<void> {
    const amount = Number(sale.total);
    if (amount <= 0) return;
    await this.accounting.createLedgerEntryWithManager(manager, {
      branchId: sale.branchId,
      entryType: LedgerEntryType.DEBIT,
      amount,
      description: `Voided POS Sale — ${sale.invoiceNumber}: ${reason}`,
      referenceNumber: sale.invoiceNumber,
      saleId: sale.id,
    });
  }
}
