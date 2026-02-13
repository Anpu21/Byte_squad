import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role } from '../../shared/enums/role.enum';

// ────────────────────────── Mock AuthService ──────────────────────────

const mockAuthService = () => ({
  login: jest.fn(),
  register: jest.fn(),
  getProfile: jest.fn(),
});

// ────────────────────────── Tests ──────────────────────────

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useFactory: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── login ──

  describe('login', () => {
    it('should call authService.login and return the result', async () => {
      const loginDto = { username: 'admin', password: 'password' };
      const expected = {
        access_token: 'jwt-token',
        user: { id: '1', username: 'admin', role: Role.ADMIN },
      };

      authService.login.mockResolvedValue(expected);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(expected);
    });
  });

  // ── register ──

  describe('register', () => {
    it('should call authService.register and return the result', async () => {
      const registerDto = {
        username: 'newuser',
        password: 'strongpw',
        role: Role.CASHIER,
      };
      const expected = { id: '2', username: 'newuser', role: Role.CASHIER };

      authService.register.mockResolvedValue(expected);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expected);
    });
  });

  // ── getProfile ──

  describe('getProfile', () => {
    it('should extract user ID from request and return profile', async () => {
      const mockReq = { user: { id: 'uuid-1234' } };
      const expected = {
        id: 'uuid-1234',
        username: 'admin',
        role: Role.ADMIN,
        createdAt: new Date('2025-01-01'),
      };

      authService.getProfile.mockResolvedValue(expected);

      const result = await controller.getProfile(mockReq);

      expect(authService.getProfile).toHaveBeenCalledWith('uuid-1234');
      expect(result).toEqual(expected);
    });
  });
});
