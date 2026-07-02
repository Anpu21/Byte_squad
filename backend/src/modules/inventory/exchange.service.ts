import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';

import { SalesReturn } from '@inventory/entities/sales-return.entity';
import { SalesReturnRepository } from '@inventory/sales-return.repository';
import { ReturnsService } from '@inventory/returns.service';
import { CreateExchangeDto } from '@inventory/dto/create-exchange.dto';
import { CreateSalesReturnDto } from '@inventory/dto/create-sales-return.dto';
import { ExchangeResult } from '@inventory/types';

import { PosService } from '@pos/pos.service';
import { PosRepository } from '@pos/pos.repository';
import { PosWriteService, ReplacementPayment } from '@pos/pos-write.service';
import { CreateSalePaymentDto } from '@pos/dto/create-sale.dto';

import { AuthUser } from '@common/types/auth-user.type';

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Tolerance for float noise when comparing returned vs replacement value.
const EPSILON = 0.005;

/**
 * ExchangeService — orchestrates a customer exchange (goods in ↔ goods out) by
 * pairing the extracted return + replacement cores in ONE transaction so both
 * legs commit together.
 *
 * Settlement is net-cash so the till (which reads
 * `sales_returns.total_refund_amount` for cash out and `payments.cash_amount`
 * for cash in, never the ledger) reconciles exactly:
 *   - even    (P == R): no money moves.
 *   - dearer  (P >  R): customer pays P−R on the replacement (Cash or Card).
 *   - cheaper (P <  R): customer gets a R−P cash refund on the return.
 * The ledger nets to the same difference (return DEBIT for cheaper, replacement
 * CREDIT for dearer), so GL ≈ till and revenue isn't double-counted.
 */
@Injectable()
export class ExchangeService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly returns: ReturnsService,
    private readonly returnsRepo: SalesReturnRepository,
    private readonly posWrite: PosWriteService,
    private readonly pos: PosRepository,
    private readonly sales: PosService,
  ) {}

  async createExchange(
    actor: AuthUser,
    dto: CreateExchangeDto,
    idempotencyKey?: string,
  ): Promise<ExchangeResult> {
    // Idempotency replay (POS double-submit guard) — keyed on the replacement
    // sale, mirroring PosWriteService.createSale.
    const key = idempotencyKey?.trim();
    if (key) {
      const existing = await this.pos.findIdempotencyKey(actor.id, key);
      if (existing) {
        return this.loadExchangeResult(existing.saleId);
      }
    }

    // --- Pre-transaction: validate + price both legs (no writes yet) ---
    // computeReturn enforces branch access + over-return limits; it throws
    // before anything is written.
    const returnDto: CreateSalesReturnDto = {
      saleId: dto.saleId,
      reason: dto.reason,
      lines: dto.returnedLines,
    };
    const computedReturn = await this.returns.computeReturn(actor, returnDto);
    const sale = computedReturn.sale;

    // Price the replacement at the ORIGINAL sale's location (so stock is taken
    // from the same place the goods came back to).
    const replacement = await this.posWrite.computeReplacement(
      dto.replacementItems,
      sale.location,
    );

    // Net-cash settlement. R = returned value, P = replacement value.
    const R = computedReturn.totalRefund;
    const P = replacement.total;
    const diff = round2(P - R);
    const { replacementPayment, refundOverride } = this.resolveSettlement(
      diff,
      dto.payment,
    );

    // --- One transaction: return leg → replacement leg → cross-link ---
    // Decrement happens at sale.branchId (not actor.branchId) so an admin can
    // process an exchange for any branch and stock moves at the right one.
    const result = await this.dataSource.transaction(async (manager) => {
      const salesReturn = await this.returns.persistReturnWithinTxn(
        manager,
        actor,
        computedReturn,
        { type: 'Exchange', refundOverride },
      );

      const replacementSale = await this.posWrite.persistReplacementWithinTxn(
        manager,
        actor,
        {
          branchId: sale.branchId,
          location: sale.location,
          customerUserId: sale.customerUserId,
          exchangeReturnId: salesReturn.id,
          replacement,
          payment: replacementPayment,
        },
      );

      await manager
        .getRepository(SalesReturn)
        .update(salesReturn.id, { replacementSaleId: replacementSale.id });
      salesReturn.replacementSaleId = replacementSale.id;

      return { salesReturn, replacementSale };
    });

    // --- Idempotency key insert (race-safe via unique-violation catch) ---
    if (key) {
      try {
        await this.pos.insertIdempotencyKey({
          key,
          cashierId: actor.id,
          saleId: result.replacementSale.id,
        });
      } catch (err) {
        if (err instanceof QueryFailedError) {
          const winning = await this.pos.findIdempotencyKey(actor.id, key);
          if (winning && winning.saleId !== result.replacementSale.id) {
            return this.loadExchangeResult(winning.saleId);
          }
        }
        throw err;
      }
    }

    return result;
  }

  /**
   * Resolve the net-cash settlement from the price difference (`diff = P − R`):
   * the replacement Payment breakdown (cash IN) and the return's refund
   * override (cash OUT). Only one direction is ever non-zero.
   *
   * A dearer swap must carry a payment with enough tender. A card upcharge
   * leaves `cashAmount = 0` so the amount surfaces as the card residual in the
   * Z-report (card money never enters the drawer).
   */
  private resolveSettlement(
    diff: number,
    payment: CreateSalePaymentDto | undefined,
  ): { replacementPayment: ReplacementPayment; refundOverride: number } {
    const none: ReplacementPayment = {
      paymentAmount: 0,
      cashAmount: 0,
      cashTendered: 0,
      cashChange: 0,
    };

    // Dearer — customer pays the difference (Cash or Card).
    if (diff > EPSILON) {
      if (!payment) {
        throw new BadRequestException(
          'A payment is required when the replacement costs more',
        );
      }
      if (payment.paymentMethod === 'Cash') {
        const tendered = round2(
          Number(payment.cashTendered ?? payment.cashAmount ?? diff),
        );
        if (tendered + 1e-6 < diff) {
          throw new BadRequestException(
            `Cash tendered (${tendered}) is less than the amount due (${diff})`,
          );
        }
        return {
          replacementPayment: {
            paymentAmount: diff,
            cashAmount: diff,
            cashTendered: tendered,
            cashChange: round2(tendered - diff),
          },
          refundOverride: 0,
        };
      }
      if (payment.paymentMethod === 'Card') {
        return {
          replacementPayment: { ...none, paymentAmount: diff },
          refundOverride: 0,
        };
      }
      throw new BadRequestException(
        'An exchange upcharge must be paid by Cash or Card',
      );
    }

    // Cheaper — refund the difference in cash on the return leg.
    if (diff < -EPSILON) {
      return { replacementPayment: none, refundOverride: round2(-diff) };
    }

    // Even — no money moves either way.
    return { replacementPayment: none, refundOverride: 0 };
  }

  /**
   * Rebuild an ExchangeResult from a persisted replacement sale — the
   * idempotency replay path. The sale's `exchangeReturnId` points at the return.
   */
  private async loadExchangeResult(
    replacementSaleId: string,
  ): Promise<ExchangeResult> {
    const replacementSale = await this.sales.findOneById(replacementSaleId);
    if (!replacementSale || !replacementSale.exchangeReturnId) {
      throw new NotFoundException('Exchange replacement sale no longer exists');
    }
    const salesReturn = await this.returnsRepo.findById(
      replacementSale.exchangeReturnId,
    );
    if (!salesReturn) {
      throw new NotFoundException('Exchange return no longer exists');
    }
    return { salesReturn, replacementSale };
  }
}
