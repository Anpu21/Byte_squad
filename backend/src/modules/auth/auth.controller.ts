import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { BACKEND_ROUTES } from '../../../../shared/routes/backend-routes.js';

@Controller(BACKEND_ROUTES.AUTH.BASE)
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post(BACKEND_ROUTES.AUTH.LOGIN)
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
