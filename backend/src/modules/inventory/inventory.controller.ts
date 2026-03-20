import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InventoryService } from '@inventory/inventory.service';
import { CreateInventoryDto } from '@inventory/dto/create-inventory.dto';
import { UpdateStockDto } from '@inventory/dto/update-stock.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import { Inventory } from '@inventory/entities/inventory.entity';

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
  findByBranch(
    @Param('branchId') branchId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('stockStatus') stockStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
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
  findLowStock(): Promise<Inventory[]> {
    return this.inventoryService.findLowStock();
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
