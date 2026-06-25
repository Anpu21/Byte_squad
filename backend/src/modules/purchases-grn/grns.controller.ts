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
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { APP_ROUTES } from '@common/routes/app.routes';
import {
  GrnsService,
  type GrnsListResponse,
} from '@/modules/purchases-grn/grns.service';
import { Grn } from '@/modules/purchases-grn/entities/grn.entity';
import { CreateGrnDto } from '@/modules/purchases-grn/dto/create-grn.dto';
import { ListGrnsQueryDto } from '@/modules/purchases-grn/dto/list-grns-query.dto';
import { VoidGrnDto } from '@/modules/purchases-grn/dto/void-grn.dto';
import type { PurchasesActor } from '@/modules/purchases-grn/types/purchases-actor.type';

@Controller(APP_ROUTES.PURCHASES.GRNS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class GrnsController {
  constructor(private readonly grns: GrnsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(
    @Query() query: ListGrnsQueryDto,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<GrnsListResponse> {
    return this.grns.list(query, actor);
  }

  @Get(APP_ROUTES.PURCHASES.GRNS.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<Grn> {
    return this.grns.getById(id, actor);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateGrnDto,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<Grn> {
    return this.grns.create(dto, actor);
  }

  @Post(APP_ROUTES.PURCHASES.GRNS.VOID)
  @Roles(UserRole.ADMIN)
  void(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VoidGrnDto,
    @CurrentUser() actor: PurchasesActor,
  ): Promise<Grn> {
    return this.grns.void(id, dto, actor);
  }
}
