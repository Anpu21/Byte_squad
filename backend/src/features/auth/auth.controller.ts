import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { Roles } from './decorators/roles.decorator.js';
import { Role } from '../../shared/enums/role.enum.js';
import { API_ROUTES } from '../../shared/routes.js';

/** Typed request with JWT user payload */
interface AuthenticatedRequest {
  user: { id: string; username: string; role: Role };
}

/**
 * Authentication controller.
 * Routes are derived from the shared API_ROUTES constants.
 */
@Controller(API_ROUTES.AUTH.BASE)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login — Public endpoint.
   * Validates credentials and returns a JWT.
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  /**
   * POST /api/auth/register — Admin-only endpoint.
   * Creates a new user with the specified role.
   */
  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /**
   * GET /api/auth/profile — Protected endpoint.
   * Returns the authenticated user's profile.
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user.id);
  }
}
