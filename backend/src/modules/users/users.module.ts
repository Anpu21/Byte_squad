import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '@users/users.service';
import { UsersController } from '@users/users.controller';
import { User } from '@users/entities/user.entity';
import { Branch } from '@branches/entities/branch.entity';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Branch]), EmailModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule],
})
export class UsersModule {}
