import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PosService } from './pos.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { UserRole } from '../../../../shared/constants/enums.js';
import { BACKEND_ROUTES } from '../../../../shared/routes/backend-routes.js';
import { Transaction } from './entities/transaction.entity.js';

@Controller(BACKEND_ROUTES.POS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER)
export class PosController {
    constructor(private readonly posService: PosService) { }

    @Post(BACKEND_ROUTES.POS.TRANSACTIONS)
    create(
        @Body() createTransactionDto: CreateTransactionDto,
        @CurrentUser('id') cashierId: string,
        @CurrentUser('branchId') branchId: string,
    ): Promise<Transaction> {
        return this.posService.createTransaction(
            createTransactionDto,
            cashierId,
            branchId,
        );
    }

    @Get(BACKEND_ROUTES.POS.TRANSACTIONS)
    findAll(@CurrentUser('branchId') branchId: string): Promise<Transaction[]> {
        return this.posService.findAll(branchId);
    }

    @Get(BACKEND_ROUTES.POS.TRANSACTION_BY_ID)
    findOne(@Param('id') id: string): Promise<Transaction | null> {
        return this.posService.findById(id);
    }
}
