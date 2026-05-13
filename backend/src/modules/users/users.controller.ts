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
import type { Actor, UserActionConfirmResult, UserActionRequestResult } from '@users/users.service';
import { CreateUserDto } from '@users/dto/create-user.dto';
import { UpdateUserDto } from '@users/dto/update-user.dto';
import { ConfirmUserActionDto } from '@users/dto/confirm-user-action.dto';
import { UpdateMyBranchDto } from '@users/dto/update-my-branch.dto';
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
    @Body()
    body: { firstName?: string; lastName?: string; phone?: string | null },
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

  // ── Admin CRUD endpoints (two-step: request → confirm OTP) ─────────────
  // Every mutating call returns a pending-action id + expiresAt and emails a
  // 6-digit code to the admin. The admin then POSTs the code to
  // POST /users/actions/:actionId/confirm to commit the change.

  @Post()
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  requestCreate(
    @CurrentUser('id') adminUserId: string,
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserActionRequestResult> {
    return this.usersService.requestCreate(adminUserId, createUserDto);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@CurrentUser() actor: Actor): Promise<User[]> {
    return this.usersService.findAll(actor);
  }

  // NOTE: declare `actions/:actionId/...` BEFORE the `:id` routes so Nest's
  // path matcher doesn't treat "actions" as a user id.

  @Post(APP_ROUTES.USERS.CONFIRM_ACTION)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  confirmAction(
    @CurrentUser('id') adminUserId: string,
    @Param('actionId') actionId: string,
    @Body() dto: ConfirmUserActionDto,
  ): Promise<UserActionConfirmResult> {
    return this.usersService.confirmAction(adminUserId, actionId, dto.otpCode);
  }

  @Post(APP_ROUTES.USERS.RESEND_ACTION_OTP)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  resendActionOtp(
    @CurrentUser('id') adminUserId: string,
    @Param('actionId') actionId: string,
  ): Promise<{ expiresAt: Date }> {
    return this.usersService.resendActionOtp(adminUserId, actionId);
  }

  @Get(APP_ROUTES.USERS.BY_ID)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string): Promise<User | null> {
    return this.usersService.findById(id);
  }

  @Patch(APP_ROUTES.USERS.BY_ID)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  requestUpdate(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserActionRequestResult> {
    return this.usersService.requestUpdate(adminUserId, id, updateUserDto);
  }

  @Delete(APP_ROUTES.USERS.BY_ID)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  requestDelete(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
  ): Promise<UserActionRequestResult> {
    return this.usersService.requestDelete(adminUserId, id);
  }

  @Post(APP_ROUTES.USERS.RESET_PASSWORD)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  requestResetPassword(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
  ): Promise<UserActionRequestResult> {
    return this.usersService.requestResetPassword(adminUserId, id);
  }

  // Legacy alias kept for backward compatibility with older frontends — same
  // OTP flow as RESET_PASSWORD.
  @Post(APP_ROUTES.USERS.RESEND_CREDENTIALS)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED)
  resendCredentials(
    @CurrentUser('id') adminUserId: string,
    @Param('id') id: string,
  ): Promise<UserActionRequestResult> {
    return this.usersService.requestResetPassword(adminUserId, id);
  }
}
