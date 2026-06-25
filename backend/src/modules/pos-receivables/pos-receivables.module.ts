import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreditTransaction } from '@/modules/pos-sales/entities/credit-transaction.entity';
import { CreditTransactionRepository } from '@/modules/pos-sales/credit-transaction.repository';
import { ReceivablesController } from '@/modules/pos-receivables/receivables.controller';
import { ReceivablesService } from '@/modules/pos-receivables/receivables.service';
import { AccountingCoreModule } from '@/modules/accounting-core/accounting-core.module';

/**
 * Customer receivables — credit statements, FIFO repayments, and credit-limit
 * management against the shared CreditTransaction table (owned by pos-sales).
 * Provides its OWN CreditTransactionRepository instance: the repository is
 * DataSource-injected and stateless, so a second instance is correct and
 * decouples this module from the heavy pos-sales module (same pattern as
 * AccountsRepository in app.module + accounting-core).
 */
@Module({
  imports: [TypeOrmModule.forFeature([CreditTransaction]), AccountingCoreModule],
  controllers: [ReceivablesController],
  providers: [CreditTransactionRepository, ReceivablesService],
  exports: [ReceivablesService],
})
export class PosReceivablesModule {}
