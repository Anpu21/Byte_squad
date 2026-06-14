import {
  Body,
  Controller,
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
  SuppliersService,
  type SuppliersActor,
  type SuppliersListResponse,
} from '@/modules/suppliers/suppliers.service';
import { Supplier } from '@/modules/suppliers/entities/supplier.entity';
import { CreateSupplierDto } from '@/modules/suppliers/dto/create-supplier.dto';
import { UpdateSupplierDto } from '@/modules/suppliers/dto/update-supplier.dto';
import { ListSuppliersQueryDto } from '@/modules/suppliers/dto/list-suppliers-query.dto';

@Controller(APP_ROUTES.SUPPLIERS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class SuppliersController {
  constructor(private readonly suppliers: SuppliersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  list(@Query() query: ListSuppliersQueryDto): Promise<SuppliersListResponse> {
    return this.suppliers.list(query);
  }

  @Get(APP_ROUTES.SUPPLIERS.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<Supplier> {
    return this.suppliers.getById(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateSupplierDto,
    @CurrentUser() actor: SuppliersActor,
  ): Promise<Supplier> {
    return this.suppliers.create(dto, actor);
  }

  @Patch(APP_ROUTES.SUPPLIERS.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSupplierDto,
  ): Promise<Supplier> {
    return this.suppliers.update(id, dto);
  }
}
