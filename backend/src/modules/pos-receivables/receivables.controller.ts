import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import {
  ReceivablesService,
  type CreditStatement,
  type ReceivablesActor,
} from '@/modules/pos-receivables/receivables.service';
import { ReceiveCreditPaymentDto } from '@/modules/pos-receivables/dto/receive-credit-payment.dto';
import { SetCreditLimitDto } from '@/modules/pos-receivables/dto/set-credit-limit.dto';
import type { ReceivableRow } from '@/modules/pos-sales/types/receivable-row.type';

@Controller(APP_ROUTES.POS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceivablesController {
  constructor(private readonly receivables: ReceivablesService) {}

  @Get(APP_ROUTES.POS.RECEIVABLES)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(): Promise<ReceivableRow[]> {
    return this.receivables.list();
  }

  @Get(APP_ROUTES.POS.RECEIVABLES_STATEMENT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  statement(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<CreditStatement> {
    return this.receivables.getStatement(userId);
  }

  @Post(APP_ROUTES.POS.RECEIVABLES_PAYMENTS)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  receivePayment(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ReceiveCreditPaymentDto,
    @CurrentUser() actor: ReceivablesActor,
  ): Promise<CreditStatement> {
    return this.receivables.receivePayment(userId, dto, actor);
  }

  @Patch(APP_ROUTES.POS.RECEIVABLES_CREDIT_LIMIT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  setCreditLimit(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SetCreditLimitDto,
  ): Promise<CreditStatement> {
    return this.receivables.setCreditLimit(userId, dto.creditLimit);
  }
}
