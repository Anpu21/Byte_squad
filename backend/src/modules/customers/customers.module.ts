import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerProfile } from '@/modules/customers/entities/customer-profile.entity';
import { CustomerProfilesRepository } from '@/modules/customers/customer-profiles.repository';

/**
 * Customer hub — unifies the phone-stitched customer identity (registered user
 * + walk-in loyalty + khata) behind one directory / 360 profile / analytics
 * surface. Phase 0 lands the foundation (the `customer_profiles` metadata table
 * + its repository); later phases add the aggregation repository, service,
 * controller, and analytics.
 */
@Module({
  imports: [TypeOrmModule.forFeature([CustomerProfile])],
  providers: [CustomerProfilesRepository],
  exports: [CustomerProfilesRepository],
})
export class CustomersModule {}
