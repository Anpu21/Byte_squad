import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { UserRole } from '../../../../shared/constants/enums.js';
import { BACKEND_ROUTES } from '../../../../shared/routes/backend-routes.js';
import { User } from './entities/user.entity.js';

@Controller(BACKEND_ROUTES.USERS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @Roles(UserRole.ADMIN)
    create(@Body() createUserDto: CreateUserDto): Promise<User> {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @Roles(UserRole.ADMIN)
    findAll(): Promise<User[]> {
        return this.usersService.findAll();
    }

    @Get(BACKEND_ROUTES.USERS.BY_ID)
    findOne(@Param('id') id: string): Promise<User | null> {
        return this.usersService.findById(id);
    }

    @Patch(BACKEND_ROUTES.USERS.BY_ID)
    @Roles(UserRole.ADMIN)
    update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<User | null> {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(BACKEND_ROUTES.USERS.BY_ID)
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string): Promise<void> {
        return this.usersService.remove(id);
    }
}
