import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '@users/users.service';
import { UsersController } from '@users/users.controller';
import { UsersRepository } from '@users/users.repository';
import { User } from '@users/entities/user.entity';
import { BranchesModule } from '@branches/branches.module';
import { EmailModule } from '../email/email.module';
import { LoyaltyModule } from '@/modules/loyalty/loyalty.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    BranchesModule,
    EmailModule,
    forwardRef(() => LoyaltyModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
