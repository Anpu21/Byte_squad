import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyCustomer } from '@/modules/loyalty-customers/entities/loyalty-customer.entity';
import { LoyaltyCustomersRepository } from '@/modules/loyalty-customers/loyalty-customers.repository';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyCustomer])],
  providers: [LoyaltyCustomersRepository],
  exports: [LoyaltyCustomersRepository],
})
export class LoyaltyCustomersModule {}
