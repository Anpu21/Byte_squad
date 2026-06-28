import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  HeldSalesService,
  type HeldSaleView,
  type HeldSalesActor,
} from '@pos/held-sales.service';
import { HoldSaleDto } from '@pos/dto/hold-sale.dto';

@Controller(APP_ROUTES.POS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class HeldSalesController {
  constructor(private readonly held: HeldSalesService) {}

  /** Park the current cart for recall on any terminal in the branch. */
  @Post(APP_ROUTES.POS.HELD_SALES)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  hold(
    @Body() dto: HoldSaleDto,
    @CurrentUser() actor: HeldSalesActor,
  ): Promise<HeldSaleView> {
    return this.held.hold(dto, actor);
  }

  /** The branch's shelf of parked sales (each carries its cart snapshot). */
  @Get(APP_ROUTES.POS.HELD_SALES)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  list(@CurrentUser() actor: HeldSalesActor): Promise<HeldSaleView[]> {
    return this.held.list(actor);
  }

  /** Drop a parked sale (after resume, or when abandoned). */
  @Delete(APP_ROUTES.POS.HELD_SALE_BY_ID)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  discard(
    @Param('id') id: string,
    @CurrentUser() actor: HeldSalesActor,
  ): Promise<void> {
    return this.held.discard(id, actor);
  }
}
