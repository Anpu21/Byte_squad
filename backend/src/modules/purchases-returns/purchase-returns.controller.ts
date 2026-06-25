import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import { PurchaseReturnsService } from '@/modules/purchases-returns/purchase-returns.service';
import { PurchaseReturn } from '@/modules/purchases-returns/entities/purchase-return.entity';
import { CreatePurchaseReturnDto } from '@/modules/purchases-returns/dto/create-purchase-return.dto';
import type { PurchasesActor } from '@/modules/purchases-grn/types/purchases-actor.type';

@Controller(APP_ROUTES.PURCHASES.RETURNS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class PurchaseReturnsController {
  constructor(private readonly returns: PurchaseReturnsService) {}

  /** Debit notes for one GRN (`?grnId=` keeps the route flat). */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listForGrn(
    @Query('grnId', ParseUUIDPipe) grnId: string,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<PurchaseReturn[]> {
    return this.returns.listForGrn(grnId, actor);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreatePurchaseReturnDto,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<PurchaseReturn> {
    return this.returns.create(dto, actor);
  }
}
