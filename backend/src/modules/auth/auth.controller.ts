import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from '@auth/auth.service';
import { LoginDto } from '@auth/dto/login.dto';
import { ChangePasswordDto } from '@auth/dto/change-password.dto';
import { APP_ROUTES } from '@common/routes/app.routes';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller(APP_ROUTES.AUTH.BASE)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post(APP_ROUTES.AUTH.LOGIN)
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post(APP_ROUTES.AUTH.CHANGE_PASSWORD)
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, changePasswordDto);
  }
}
