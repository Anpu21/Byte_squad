import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import {
  JournalVouchersService,
  type JournalActor,
} from '@/modules/accounting-core/journal-vouchers.service';
import { JournalVoucher } from '@/modules/accounting-core/entities/journal-voucher.entity';
import { CreateJournalVoucherDto } from '@/modules/accounting-core/dto/create-journal-voucher.dto';

@Controller(APP_ROUTES.ACCOUNTING.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class JournalVouchersController {
  constructor(private readonly journals: JournalVouchersService) {}

  /** Post a balanced manual journal (admin only — the accountant's pen). */
  @Post(APP_ROUTES.ACCOUNTING.JOURNALS)
  @Roles(UserRole.ADMIN)
  create(
    @Body() dto: CreateJournalVoucherDto,
    @CurrentUser() actor: JournalActor,
  ): Promise<JournalVoucher> {
    return this.journals.create(dto, actor);
  }
}
