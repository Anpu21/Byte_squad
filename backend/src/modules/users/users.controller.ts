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
import { UsersService } from '@users/users.service';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import { User } from '@users/entities/user.entity';

@Controller(APP_ROUTES.USERS.BASE)
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

    @Get(APP_ROUTES.USERS.BY_ID)
    findOne(@Param('id') id: string): Promise<User | null> {
        return this.usersService.findById(id);
    }

    @Patch(APP_ROUTES.USERS.BY_ID)
    @Roles(UserRole.ADMIN)
    update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<User | null> {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(APP_ROUTES.USERS.BY_ID)
    @Roles(UserRole.ADMIN)
    remove(@Param('id') id: string): Promise<void> {
        return this.usersService.remove(id);
    }
}
