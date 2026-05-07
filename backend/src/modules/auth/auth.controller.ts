import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '@auth/auth.service';
import { LoginDto } from '@auth/dto/login.dto';
import { SignupDto } from '@auth/dto/signup.dto';
import { VerifyOtpDto } from '@auth/dto/verify-otp.dto';
import { ResendOtpDto } from '@auth/dto/resend-otp.dto';
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

  @Post(APP_ROUTES.AUTH.SIGNUP)
  signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post(APP_ROUTES.AUTH.VERIFY_OTP)
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  @Post(APP_ROUTES.AUTH.RESEND_OTP)
  @HttpCode(HttpStatus.OK)
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
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
