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
import {
  ShipmentsService,
  type PaginatedShipments,
} from '@stock-transfers/shipments.service';
import { Shipment } from '@stock-transfers/entities/shipment.entity';
import { CreateShipmentDto } from '@stock-transfers/dto/create-shipment.dto';
import { AssignCourierDto } from '@stock-transfers/dto/assign-courier.dto';
import { ShipmentCheckpointDto } from '@stock-transfers/dto/shipment-checkpoint.dto';
import { ReturnShipmentDto } from '@stock-transfers/dto/return-shipment.dto';
import { ListShipmentsQueryDto } from '@stock-transfers/dto/list-shipments-query.dto';
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
  branchId: string | null;
}

@Controller(APP_ROUTES.SHIPMENTS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() dto: CreateShipmentDto,
    @CurrentUser() actor: ActorPayload,
  ): Promise<Shipment> {
    return this.shipments.createFromLines(actor, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER)
  list(
    @Query() query: ListShipmentsQueryDto,
    @CurrentUser() actor: ActorPayload,
  ): Promise<PaginatedShipments> {
    return this.shipments.list(actor, query);
  }

  @Get(APP_ROUTES.SHIPMENTS.BY_ID)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER)
  findById(
    @Param('id') id: string,
    @CurrentUser() actor: ActorPayload,
  ): Promise<Shipment> {
    return this.shipments.findById(id, actor);
  }

  @Patch(APP_ROUTES.SHIPMENTS.ASSIGN_COURIER)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  assignCourier(
    @Param('id') id: string,
    @Body() dto: AssignCourierDto,
    @CurrentUser() actor: ActorPayload,
  ): Promise<Shipment> {
    return this.shipments.assignCourier(id, dto, actor);
  }

  @Patch(APP_ROUTES.SHIPMENTS.DISPATCH)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER)
  dispatch(
    @Param('id') id: string,
    @CurrentUser() actor: ActorPayload,
  ): Promise<Shipment> {
    return this.shipments.dispatch(id, actor);
  }

  @Patch(APP_ROUTES.SHIPMENTS.CHECKPOINT)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER)
  checkpoint(
    @Param('id') id: string,
    @Body() dto: ShipmentCheckpointDto,
    @CurrentUser() actor: ActorPayload,
  ): Promise<Shipment> {
    return this.shipments.addCheckpoint(id, dto, actor);
  }

  @Patch(APP_ROUTES.SHIPMENTS.OUT_FOR_DELIVERY)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER)
  outForDelivery(
    @Param('id') id: string,
    @CurrentUser() actor: ActorPayload,
  ): Promise<Shipment> {
    return this.shipments.markOutForDelivery(id, actor);
  }

  @Patch(APP_ROUTES.SHIPMENTS.DELIVER)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER)
  deliver(
    @Param('id') id: string,
    @CurrentUser() actor: ActorPayload,
  ): Promise<Shipment> {
    return this.shipments.deliver(id, actor);
  }

  @Patch(APP_ROUTES.SHIPMENTS.RETURN)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WORKER)
  returnShipment(
    @Param('id') id: string,
    @Body() dto: ReturnShipmentDto,
    @CurrentUser() actor: ActorPayload,
  ): Promise<Shipment> {
    return this.shipments.returnShipment(id, dto, actor);
  }

  @Patch(APP_ROUTES.SHIPMENTS.CANCEL)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  cancel(
    @Param('id') id: string,
    @Body() dto: ReturnShipmentDto,
    @CurrentUser() actor: ActorPayload,
  ): Promise<Shipment> {
    return this.shipments.cancel(id, dto, actor);
  }
}
