import { Controller, Get, NotFoundException, UseGuards } from '@nestjs/common';
import {
  CustomersService,
  CustomerProfile,
} from '@/modules/customers/customers.service';
import { CustomerJwtAuthGuard } from '@/modules/customers/guards/customer-jwt-auth.guard';
import { CurrentCustomer } from '@/modules/customers/decorators/current-customer.decorator';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.CUSTOMERS.BASE)
@UseGuards(CustomerJwtAuthGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get(APP_ROUTES.CUSTOMERS.ME)
  async me(
    @CurrentCustomer('id') customerId: string,
  ): Promise<CustomerProfile> {
    const customer = await this.customersService.findById(customerId);
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return this.customersService.toProfile(customer);
  }
}
