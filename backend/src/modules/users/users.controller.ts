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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from '@users/users.service';
import type { Actor } from '@users/users.service';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { UpdateMyBranchDto } from '@users/dto/update-my-branch.dto';
import { UpdateProfileDto } from '@users/dto/update-profile.dto';
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
    @Body() body: UpdateProfileDto,
  ): Promise<User | null> {
    return this.usersService.updateProfile(userId, body);
  }

  @Patch(APP_ROUTES.USERS.MY_BRANCH)
  @Roles(UserRole.CUSTOMER)
  updateMyBranch(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMyBranchDto,
  ): Promise<User | null> {
    return this.usersService.updateMyBranch(userId, dto.branchId);
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

  // ── Admin CRUD endpoints (direct, no OTP) ──────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN)
  create(
    @CurrentUser('id') adminUserId: string,
    @Body() createUserDto: CreateUserDto,
  ): Promise<User> {
    return this.usersService.create(adminUserId, createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@CurrentUser() actor: Actor): Promise<User[]> {
    return this.usersService.findAll(actor);
  }

  @Get(APP_ROUTES.USERS.BY_ID)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }

  @Patch(APP_ROUTES.USERS.BY_ID)
  @Roles(UserRole.ADMIN)
  update(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    return this.usersService.update(adminUserId, id, updateUserDto);
  }

  @Delete(APP_ROUTES.USERS.BY_ID)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.usersService.delete(adminUserId, id);
  }

  @Post(APP_ROUTES.USERS.RESET_PASSWORD)
  @Roles(UserRole.ADMIN)
  resetPassword(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
  ): Promise<User | null> {
    return this.usersService.resetPassword(adminUserId, id);
  }

  // Legacy alias kept for backward compatibility with older frontends — same
  // direct reset-password flow.
  @Post(APP_ROUTES.USERS.RESEND_CREDENTIALS)
  @Roles(UserRole.ADMIN)
  resendCredentials(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
  ): Promise<User | null> {
    return this.usersService.resetPassword(adminUserId, id);
  }
}
