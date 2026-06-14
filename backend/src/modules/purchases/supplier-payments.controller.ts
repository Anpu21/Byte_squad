import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import {
  SupplierPaymentsService,
  type SupplierPaymentsListResponse,
} from '@/modules/purchases/supplier-payments.service';
import { SupplierPaymentsRepository } from '@/modules/purchases/supplier-payments.repository';
import { SupplierPayment } from '@/modules/purchases/entities/supplier-payment.entity';
import { CreateSupplierPaymentDto } from '@/modules/purchases/dto/create-supplier-payment.dto';
import { ListSupplierPaymentsQueryDto } from '@/modules/purchases/dto/list-supplier-payments-query.dto';
import type { PurchasesActor } from '@/modules/purchases/types/purchases-actor.type';

@Controller(APP_ROUTES.PURCHASES.PAYMENTS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class SupplierPaymentsController {
  constructor(
    private readonly payments: SupplierPaymentsService,
    private readonly paymentsRepo: SupplierPaymentsRepository,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(
    @Query() query: ListSupplierPaymentsQueryDto,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<SupplierPaymentsListResponse> {
    return this.payments.list(query, actor);
  }

  @Get(APP_ROUTES.PURCHASES.PAYMENTS.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SupplierPayment> {
    const payment = await this.paymentsRepo.findById(id);
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateSupplierPaymentDto,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<SupplierPayment> {
    return this.payments.create(dto, actor);
  }
}
