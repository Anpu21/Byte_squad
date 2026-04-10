import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from '@users/users.service';
import type { Actor } from '@users/users.service';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { UserRole } from '@common/enums/user-roles.enums';
import { APP_ROUTES } from '@common/routes/app.routes';
import { User } from '@users/entities/user.entity';

@Controller(APP_ROUTES.USERS.BASE)
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ── Profile endpoints (all authenticated users) ──────────

  @Get(APP_ROUTES.USERS.PROFILE)
  getProfile(@CurrentUser('id') userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  @Patch(APP_ROUTES.USERS.PROFILE)
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() body: { firstName?: string; lastName?: string },
  ): Promise<User | null> {
    return this.usersService.updateProfile(userId, body);
  }

  @Post(APP_ROUTES.USERS.PROFILE_AVATAR)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<User | null> {
    return this.usersService.updateAvatar(userId, file);
  }

  // ── Admin CRUD endpoints ─────────────────────────────────

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() actor: Actor,
  ): Promise<User> {
    return this.usersService.create(createUserDto, actor);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findAll(@CurrentUser() actor: Actor): Promise<User[]> {
    return this.usersService.findAll(actor);
  }

  @Get(APP_ROUTES.USERS.BY_ID)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }

  @Patch(APP_ROUTES.USERS.BY_ID)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() actor: Actor,
  ): Promise<User | null> {
    return this.usersService.update(id, updateUserDto, actor);
  }

  @Delete(APP_ROUTES.USERS.BY_ID)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  remove(
    @Param('id') id: string,
    @CurrentUser() actor: Actor,
  ): Promise<void> {
    return this.usersService.remove(id, actor);
  }

  @Post(APP_ROUTES.USERS.RESEND_CREDENTIALS)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  resendCredentials(
    @Param('id') id: string,
    @CurrentUser() actor: Actor,
  ): Promise<void> {
    return this.usersService.resendCredentials(id, actor);
  }

  @Post(APP_ROUTES.USERS.RESET_PASSWORD)
  @Roles(UserRole.SUPER_ADMIN)
  resetPassword(
    @Param('id') id: string,
    @CurrentUser() actor: Actor,
  ): Promise<void> {
    return this.usersService.resendCredentials(id, actor);
  }
}
