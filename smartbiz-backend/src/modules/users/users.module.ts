import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Role } from './entities';
import { UserRepository, RoleRepository } from './repositories';
import { UserService } from './services';
import { UserController } from './controllers';
import { UserMapper } from './mappers';

@Module({
    imports: [TypeOrmModule.forFeature([User, Role])],
    controllers: [UserController],
    providers: [
        UserService,
        UserRepository,
        RoleRepository,
        UserMapper,
    ],
    exports: [UserService, UserRepository, RoleRepository],
})
export class UsersModule { }
