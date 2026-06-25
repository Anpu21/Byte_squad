import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
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
  DiscountSchemesService,
  type SchemesActor,
} from '@/modules/pos-discounts/discount-schemes.service';
import { DiscountScheme } from '@/modules/pos-discounts/entities/discount-scheme.entity';
import { CreateDiscountSchemeDto } from '@/modules/pos-discounts/dto/create-discount-scheme.dto';
import { UpdateDiscountSchemeDto } from '@/modules/pos-discounts/dto/update-discount-scheme.dto';

@Controller(APP_ROUTES.POS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class DiscountSchemesController {
  constructor(private readonly schemes: DiscountSchemesService) {}

  /** Active rules for the till — the POS caches and applies these. */
  @Get(APP_ROUTES.POS.SCHEMES_ACTIVE)
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  active(@CurrentUser() actor: SchemesActor): Promise<DiscountScheme[]> {
    return this.schemes.activeForCashier(actor);
  }

  @Get(APP_ROUTES.POS.SCHEMES)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(
    @CurrentUser() actor: SchemesActor,
    @Query('isActive') isActive?: string,
  ) {
    return this.schemes.list(
      actor,
      isActive === undefined ? undefined : isActive === 'true',
    );
  }

  @Post(APP_ROUTES.POS.SCHEMES)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateDiscountSchemeDto,
    @CurrentUser() actor: SchemesActor,
  ): Promise<DiscountScheme> {
    return this.schemes.create(dto, actor);
  }

  @Patch(APP_ROUTES.POS.SCHEME_BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDiscountSchemeDto,
    @CurrentUser() actor: SchemesActor,
  ): Promise<DiscountScheme> {
    return this.schemes.update(id, dto, actor);
  }

  @Delete(APP_ROUTES.POS.SCHEME_BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: SchemesActor,
  ): Promise<{ deleted: true }> {
    await this.schemes.remove(id, actor);
    return { deleted: true };
  }
}
