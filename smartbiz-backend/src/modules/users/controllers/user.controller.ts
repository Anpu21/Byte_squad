import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { UserMapper } from '../mappers/user.mapper';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../dto';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { Role } from '@common/constants/roles.enum';

@Controller('users')
@UseGuards(RolesGuard)
export class UserController {
    constructor(
        private readonly userService: UserService,
        private readonly userMapper: UserMapper,
    ) { }

    @Get()
    @Roles(Role.ADMIN, Role.MANAGER)
    async findAll(): Promise<UserResponseDto[]> {
        const users = await this.userService.findAll();
        return this.userMapper.toResponseList(users);
    }

    @Get(':id')
    @Roles(Role.ADMIN, Role.MANAGER)
    async findById(
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<UserResponseDto> {
        const user = await this.userService.findById(id);
        return this.userMapper.toResponse(user);
    }

    @Post()
    @Roles(Role.ADMIN)
    async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
        const user = await this.userService.create(createUserDto);
        return this.userMapper.toResponse(user);
    }

    @Put(':id')
    @Roles(Role.ADMIN)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateUserDto: UpdateUserDto,
    ): Promise<UserResponseDto> {
        const user = await this.userService.update(id, updateUserDto);
        return this.userMapper.toResponse(user);
    }

    @Delete(':id')
    @Roles(Role.ADMIN)
    async delete(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
        await this.userService.delete(id);
    }
}
