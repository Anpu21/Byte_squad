import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ExpiryService } from '@inventory/expiry.service';
import { CreateProductBatchDto } from '@inventory/dto/create-product-batch.dto';
import { ListExpiryQueryDto } from '@inventory/dto/list-expiry-query.dto';
import { ProductBatch } from '@inventory/entities/product-batch.entity';
import { ExpiryReport } from '@inventory/types';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.INVENTORY.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExpiryController {
  constructor(private readonly expiry: ExpiryService) {}

  @Post(APP_ROUTES.INVENTORY.BATCHES)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createBatch(
    @Body() dto: CreateProductBatchDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<ProductBatch> {
    return this.expiry.createBatch(dto, actor);
  }

  @Get(APP_ROUTES.INVENTORY.BATCHES)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listForProduct(
    @Query('productId') productId: string,
    @CurrentUser() actor: AuthUser,
  ): Promise<ProductBatch[]> {
    return this.expiry.listForProduct(actor, productId);
  }

  @Get(APP_ROUTES.INVENTORY.EXPIRY_REPORT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  report(
    @Query() query: ListExpiryQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<ExpiryReport> {
    return this.expiry.getExpiryReport(actor, query);
  }

  @Post(APP_ROUTES.INVENTORY.EXPIRY_ALERTS_SCAN)
  @Roles(UserRole.ADMIN)
  scan(@CurrentUser() actor: AuthUser) {
    return this.expiry.scanAndAlert(actor);
  }
}
