import {
    Controller,
    Get,
    Patch,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../../shared/constants/enums.js';
import { BACKEND_ROUTES } from '../../../../shared/routes/backend-routes.js';
import { Inventory } from './entities/inventory.entity.js';

@Controller(BACKEND_ROUTES.INVENTORY.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get(BACKEND_ROUTES.INVENTORY.BY_BRANCH)
    findByBranch(@Param('branchId') branchId: string): Promise<Inventory[]> {
        return this.inventoryService.findByBranch(branchId);
    }

    @Get(BACKEND_ROUTES.INVENTORY.LOW_STOCK)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    findLowStock(): Promise<Inventory[]> {
        return this.inventoryService.findLowStock();
    }

    @Patch(BACKEND_ROUTES.INVENTORY.UPDATE_STOCK)
    @Roles(UserRole.ADMIN, UserRole.MANAGER)
    updateStock(
        @Param('id') id: string,
        @Body() updateStockDto: UpdateStockDto,
    ): Promise<Inventory | null> {
        return this.inventoryService.updateStock(id, updateStockDto);
    }
}
