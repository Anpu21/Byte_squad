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
import { StockTransfersService } from '@stock-transfers/stock-transfers.service';
import type {
  PaginatedTransfers,
  SourceOption,
} from '@stock-transfers/stock-transfers.service';
import { CreateTransferRequestDto } from '@stock-transfers/dto/create-transfer-request.dto';
import { ApproveTransferDto } from '@stock-transfers/dto/approve-transfer.dto';
import { RejectTransferDto } from '@stock-transfers/dto/reject-transfer.dto';
import { ListTransfersQueryDto } from '@stock-transfers/dto/list-transfers-query.dto';
import { StockTransferRequest } from '@stock-transfers/entities/stock-transfer-request.entity';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';

interface ActorPayload {
  id: string;
  email: string;
  role: UserRole;
  branchId: string;
}

@Controller(APP_ROUTES.STOCK_TRANSFERS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockTransfersController {
  constructor(private readonly stockTransfersService: StockTransfersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateTransferRequestDto,
    @CurrentUser() actor: ActorPayload,
  ): Promise<StockTransferRequest> {
    return this.stockTransfersService.create(dto, actor);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  listAll(@Query() query: ListTransfersQueryDto): Promise<PaginatedTransfers> {
    return this.stockTransfersService.listForAdmin(query);
  }

  // Specific paths must come before :id paths so Nest does not match
  // "my-requests" as an :id.
  @Get(APP_ROUTES.STOCK_TRANSFERS.MY_REQUESTS)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listMyRequests(
    @CurrentUser() actor: ActorPayload,
    @Query() query: ListTransfersQueryDto,
  ): Promise<PaginatedTransfers> {
    return this.stockTransfersService.listMyRequests(actor, query);
  }

  @Get(APP_ROUTES.STOCK_TRANSFERS.INCOMING)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listIncoming(
    @CurrentUser() actor: ActorPayload,
    @Query() query: ListTransfersQueryDto,
  ): Promise<PaginatedTransfers> {
    return this.stockTransfersService.listIncoming(actor, query);
  }

  @Get(APP_ROUTES.STOCK_TRANSFERS.SOURCE_OPTIONS)
  @Roles(UserRole.ADMIN)
  getSourceOptions(@Param('id') id: string): Promise<SourceOption[]> {
    return this.stockTransfersService.getSourceOptions(id);
  }

  @Get(APP_ROUTES.STOCK_TRANSFERS.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findById(
    @Param('id') id: string,
    @CurrentUser() actor: ActorPayload,
  ): Promise<StockTransferRequest> {
    return this.stockTransfersService.findById(id, actor);
  }

  @Patch(APP_ROUTES.STOCK_TRANSFERS.APPROVE)
  @Roles(UserRole.ADMIN)
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveTransferDto,
    @CurrentUser() actor: ActorPayload,
  ): Promise<StockTransferRequest> {
    return this.stockTransfersService.approve(id, dto, actor);
  }

  @Patch(APP_ROUTES.STOCK_TRANSFERS.REJECT)
  @Roles(UserRole.ADMIN)
  reject(
    @Param('id') id: string,
    @Body() dto: RejectTransferDto,
    @CurrentUser() actor: ActorPayload,
  ): Promise<StockTransferRequest> {
    return this.stockTransfersService.reject(id, dto, actor);
  }

  @Patch(APP_ROUTES.STOCK_TRANSFERS.CANCEL)
  @Roles(UserRole.ADMIN)
  cancel(
    @Param('id') id: string,
    @CurrentUser() actor: ActorPayload,
  ): Promise<StockTransferRequest> {
    return this.stockTransfersService.cancel(id, actor);
  }

  @Patch(APP_ROUTES.STOCK_TRANSFERS.SHIP)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  ship(
    @Param('id') id: string,
    @CurrentUser() actor: ActorPayload,
  ): Promise<StockTransferRequest> {
    return this.stockTransfersService.ship(id, actor);
  }

  @Patch(APP_ROUTES.STOCK_TRANSFERS.RECEIVE)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  receive(
    @Param('id') id: string,
    @CurrentUser() actor: ActorPayload,
  ): Promise<StockTransferRequest> {
    return this.stockTransfersService.receive(id, actor);
  }
}
