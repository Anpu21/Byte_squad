import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '@auth/auth.service';
import { LoginDto } from '@auth/dto/login.dto';
import { APP_ROUTES } from '@common/routes/app.routes';

@Controller(APP_ROUTES.AUTH.BASE)
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post(APP_ROUTES.AUTH.LOGIN)
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
