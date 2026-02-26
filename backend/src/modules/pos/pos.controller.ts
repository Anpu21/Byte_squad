import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { PosService } from '@pos/pos.service.js';
import { CreateTransactionDto } from '@pos/dto/create-transaction.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES} from '@common/routes/app.routes';
import { Transaction } from '@pos/entities/transaction.entity';

@Controller(APP_ROUTES.POS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.CASHIER, UserRole.ADMIN, UserRole.MANAGER)
export class PosController {
    constructor(private readonly posService: PosService) { }

    @Post(APP_ROUTES.POS.TRANSACTIONS)
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

    @Get(APP_ROUTES.POS.TRANSACTIONS)
    findAll(@CurrentUser('branchId') branchId: string): Promise<Transaction[]> {
        return this.posService.findAll(branchId);
    }

    @Get(APP_ROUTES.POS.TRANSACTION_BY_ID)
    findOne(@Param('id') id: string): Promise<Transaction | null> {
        return this.posService.findById(id);
    }
}
