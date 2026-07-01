import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BrandsService } from '@/modules/brands/brands.service';
import { type BrandWithCount } from '@/modules/brands/brands.repository';
import { CreateBrandDto } from '@/modules/brands/dto/create-brand.dto';
import { UpdateBrandDto } from '@/modules/brands/dto/update-brand.dto';
import { BrandAnalyticsQueryDto } from '@/modules/brands/dto/brand-analytics-query.dto';
import { Brand } from '@/modules/brands/entities/brand.entity';
import type {
  BrandOverviewResponse,
  BrandDrilldownResponse,
} from '@/modules/brands/types';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.BRANDS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class BrandsController {
  constructor(private readonly service: BrandsService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  list(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<BrandWithCount[]> {
    return this.service.list(includeInactive === 'true');
  }

  // Analytics routes are declared before `:id` so `analytics/...` isn't
  // captured by the param route (overview before :brandId for the same reason).
  @Get(APP_ROUTES.BRANDS.ANALYTICS_OVERVIEW)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  overview(
    @Query() query: BrandAnalyticsQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<BrandOverviewResponse> {
    return this.service.getOverview(actor, query);
  }

  @Get(APP_ROUTES.BRANDS.ANALYTICS_BRAND)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  brandAnalytics(
    @Param('brandId') brandId: string,
    @Query() query: BrandAnalyticsQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<BrandDrilldownResponse> {
    return this.service.getBrandAnalytics(actor, brandId, query);
  }

  // Read one brand (+ product count). After the analytics routes so a two-segment
  // `analytics/...` path is never captured by this single-segment `:id`.
  @Get(APP_ROUTES.BRANDS.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getOne(@Param('id') id: string): Promise<BrandWithCount> {
    return this.service.getById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateBrandDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<Brand> {
    return this.service.create(dto, actor);
  }

  @Patch(APP_ROUTES.BRANDS.ARCHIVE)
  @Roles(UserRole.ADMIN)
  archive(@Param('id') id: string): Promise<Brand> {
    return this.service.archive(id);
  }

  @Patch(APP_ROUTES.BRANDS.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateBrandDto): Promise<Brand> {
    return this.service.update(id, dto);
  }

  // Guarded hard delete — 409 when products still reference the brand (archive
  // instead). Admin only, matching archive.
  @Delete(APP_ROUTES.BRANDS.BY_ID)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string): Promise<void> {
    return this.service.remove(id);
  }
}
