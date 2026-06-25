import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { InventoryService } from '@/modules/inventory-core/inventory.service';
import { CreateInventoryDto } from '@/modules/inventory-core/dto/create-inventory.dto';
import { UpdateStockDto } from '@/modules/inventory-core/dto/update-stock.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import { Inventory } from '@/modules/inventory-core/entities/inventory.entity';

@Controller(APP_ROUTES.INVENTORY.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() createInventoryDto: CreateInventoryDto) {
    return this.inventoryService.create(createInventoryDto);
  }

  @Get(APP_ROUTES.INVENTORY.BY_BRANCH)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findByBranch(
    @Param('branchId') branchId: string,
    @CurrentUser() actor: { role: UserRole; branchId: string | null },
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('stockStatus') stockStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (actor.role !== UserRole.ADMIN && actor.branchId !== branchId) {
      throw new ForbiddenException('Cannot access another branch');
    }
    return this.inventoryService.findByBranch(branchId, {
      search,
      category,
      stockStatus,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get(APP_ROUTES.INVENTORY.LOW_STOCK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findLowStock(
    @CurrentUser() actor: { role: UserRole; branchId: string | null },
  ): Promise<Inventory[]> {
    if (actor.role === UserRole.ADMIN) {
      return this.inventoryService.findLowStock();
    }
    if (!actor.branchId) {
      throw new ForbiddenException('No branch assigned');
    }
    return this.inventoryService.findLowStock(actor.branchId);
  }

  @Patch(APP_ROUTES.INVENTORY.UPDATE_STOCK)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
  ): Promise<Inventory | null> {
    return this.inventoryService.updateStock(id, updateStockDto);
  }
}
