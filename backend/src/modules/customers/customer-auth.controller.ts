import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CustomersService } from '@/modules/customers/customers.service';
import { CustomerSignupDto } from '@/modules/customers/dto/customer-signup.dto';
import { CustomerLoginDto } from '@/modules/customers/dto/customer-login.dto';
import { CustomerVerifyOtpDto } from '@/modules/customers/dto/customer-verify-otp.dto';
import { CustomerResendOtpDto } from '@/modules/customers/dto/customer-resend-otp.dto';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.CUSTOMER_AUTH.BASE)
export class CustomerAuthController {
  constructor(private readonly customersService: CustomersService) {}

  @Post(APP_ROUTES.CUSTOMER_AUTH.SIGNUP)
  signup(@Body() dto: CustomerSignupDto) {
    return this.customersService.signup(dto);
  }

  @Post(APP_ROUTES.CUSTOMER_AUTH.VERIFY_OTP)
  @HttpCode(HttpStatus.OK)
  verifyOtp(@Body() dto: CustomerVerifyOtpDto) {
    return this.customersService.verifyOtp(dto);
  }

  @Post(APP_ROUTES.CUSTOMER_AUTH.RESEND_OTP)
  @HttpCode(HttpStatus.OK)
  resendOtp(@Body() dto: CustomerResendOtpDto) {
    return this.customersService.resendOtp(dto);
  }

  @Post(APP_ROUTES.CUSTOMER_AUTH.LOGIN)
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: CustomerLoginDto) {
    return this.customersService.login(dto);
  }
}
