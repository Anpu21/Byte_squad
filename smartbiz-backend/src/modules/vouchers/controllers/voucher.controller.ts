import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { AccountingEngineService } from '../services/accounting-engine.service';
import { CreateVoucherDto } from '../dto/create-voucher.dto';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Role } from '@common/constants/roles.enum';
import { Voucher } from '../entities/voucher.entity';

@Controller('vouchers')
@UseGuards(RolesGuard)
export class VoucherController {
    constructor(private readonly accountingEngine: AccountingEngineService) { }

    @Post()
    @Roles(Role.ADMIN, Role.ACCOUNTANT)
    async create(
        @Body() createVoucherDto: CreateVoucherDto,
        @CurrentUser('id') userId: string,
    ): Promise<Voucher> {
        return this.accountingEngine.createVoucher(createVoucherDto, userId);
    }

    @Patch(':id/post')
    @Roles(Role.ADMIN, Role.ACCOUNTANT)
    async post(@Param('id', ParseUUIDPipe) id: string): Promise<Voucher> {
        return this.accountingEngine.postVoucher(id);
    }

    @Patch(':id/void')
    @Roles(Role.ADMIN)
    async void(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('reason') reason: string,
    ): Promise<Voucher> {
        return this.accountingEngine.voidVoucher(id, reason);
    }
}
