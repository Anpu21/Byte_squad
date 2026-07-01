import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerProfile } from '@/modules/customers/entities/customer-profile.entity';
import { CustomerProfilesRepository } from '@/modules/customers/customer-profiles.repository';
import { CustomersRepository } from '@/modules/customers/customers.repository';
import { CustomersService } from '@/modules/customers/customers.service';
import { CustomersController } from '@/modules/customers/customers.controller';

/**
 * Customer hub — unifies the phone-stitched customer identity (registered user
 * + walk-in loyalty + khata) behind one directory / 360 profile / analytics
 * surface. The aggregation reads (CustomersRepository) run raw parameterized SQL
 * over users/loyalty/credit/sales via the global DataSource; the metadata
 * side-table has its own CustomerProfilesRepository.
 */
@Module({
  imports: [TypeOrmModule.forFeature([CustomerProfile])],
  controllers: [CustomersController],
  providers: [
    CustomerProfilesRepository,
    CustomersRepository,
    CustomersService,
  ],
  exports: [CustomerProfilesRepository, CustomersRepository, CustomersService],
})
export class CustomersModule {}
