import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from '@/modules/categories/categories.service';
import { CreateCategoryDto } from '@/modules/categories/dto/create-category.dto';
import { UpdateCategoryDto } from '@/modules/categories/dto/update-category.dto';
import { CategoryAnalyticsQueryDto } from '@/modules/categories/dto/category-analytics-query.dto';
import { Category } from '@/modules/categories/entities/category.entity';
import type { CategoryAnalyticsResponse } from '@/modules/categories/types';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import type { AuthUser } from '@common/types/auth-user.type';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.CATEGORIES.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  list(
    @Query('includeInactive') includeInactive?: string,
  ): Promise<Category[]> {
    return this.service.list(includeInactive === 'true');
  }

  @Get(APP_ROUTES.CATEGORIES.ANALYTICS)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  analytics(
    @Query() query: CategoryAnalyticsQueryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<CategoryAnalyticsResponse> {
    return this.service.getAnalytics(actor, query);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateCategoryDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<Category> {
    return this.service.create(dto, actor);
  }

  @Patch(APP_ROUTES.CATEGORIES.ARCHIVE)
  @Roles(UserRole.ADMIN)
  archive(@Param('id') id: string): Promise<Category> {
    return this.service.archive(id);
  }

  @Patch(APP_ROUTES.CATEGORIES.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.service.update(id, dto);
  }
}
