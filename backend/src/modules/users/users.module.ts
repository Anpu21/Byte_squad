import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '@users/users.service';
import { UsersController } from '@users/users.controller';
import { UsersRepository } from '@users/users.repository';
import { PendingUserActionsRepository } from '@users/pending-user-actions.repository';
import { User } from '@users/entities/user.entity';
import { PendingUserAction } from '@users/entities/pending-user-action.entity';
import { BranchesModule } from '@branches/branches.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PendingUserAction]),
    BranchesModule,
    EmailModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, PendingUserActionsRepository],
  exports: [UsersService, UsersRepository, TypeOrmModule],
})
export class UsersModule {}
