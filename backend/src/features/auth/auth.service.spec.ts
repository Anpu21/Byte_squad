import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from './entities/user.entity';
import { Role } from '../../shared/enums/role.enum';

// ────────────────────────── Helpers ──────────────────────────

const mockUser: User = {
    id: 'uuid-1234',
    username: 'admin',
    password: '$2b$10$hashedpassword',
    role: Role.ADMIN,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
};

const mockUserRepository = () => ({
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
});

const mockJwtService = () => ({
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
});

// ────────────────────────── Tests ──────────────────────────

describe('AuthService', () => {
    let service: AuthService;
    let userRepo: jest.Mocked<Repository<User>>;
    let jwtService: jest.Mocked<JwtService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: getRepositoryToken(User), useFactory: mockUserRepository },
                { provide: JwtService, useFactory: mockJwtService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        userRepo = module.get(getRepositoryToken(User));
        jwtService = module.get(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    // ── validateUser ──

    describe('validateUser', () => {
        it('should return user when credentials are valid', async () => {
            userRepo.findOne.mockResolvedValue(mockUser);
            jest
                .spyOn(bcrypt, 'compare')
                .mockReturnValue(Promise.resolve(true) as never);

            const result = await service.validateUser('admin', 'password');

            expect(result).toEqual(mockUser);
            expect(userRepo.findOne).toHaveBeenCalledWith({
                where: { username: 'admin' },
            });
        });

        it('should throw UnauthorizedException when user is not found', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.validateUser('ghost', 'password'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException when password is invalid', async () => {
            userRepo.findOne.mockResolvedValue(mockUser);
            jest
                .spyOn(bcrypt, 'compare')
                .mockReturnValue(Promise.resolve(false) as never);

            await expect(service.validateUser('admin', 'wrong')).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });

    // ── login ──

    describe('login', () => {
        it('should return access_token and user on valid credentials', async () => {
            userRepo.findOne.mockResolvedValue(mockUser);
            jest
                .spyOn(bcrypt, 'compare')
                .mockReturnValue(Promise.resolve(true) as never);

            const result = await service.login({
                username: 'admin',
                password: 'password',
            });

            expect(result).toEqual({
                access_token: 'mock-jwt-token',
                user: {
                    id: mockUser.id,
                    username: mockUser.username,
                    role: mockUser.role,
                },
            });
            expect(jwtService.sign).toHaveBeenCalledWith({
                sub: mockUser.id,
                username: mockUser.username,
                role: mockUser.role,
            });
        });

        it('should throw when credentials are invalid', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(
                service.login({ username: 'ghost', password: 'wrong' }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    // ── register ──

    describe('register', () => {
        it('should create and return a new user', async () => {
            userRepo.findOne.mockResolvedValue(null);
            jest
                .spyOn(bcrypt, 'hash')
                .mockReturnValue(Promise.resolve('hashed-pw') as never);
            userRepo.create.mockReturnValue({
                ...mockUser,
                password: 'hashed-pw',
            } as User);
            userRepo.save.mockResolvedValue({ ...mockUser, password: 'hashed-pw' });

            const result = await service.register({
                username: 'newuser',
                password: 'strongpw',
                role: Role.CASHIER,
            });

            expect(result).toEqual({
                id: mockUser.id,
                username: mockUser.username,
                role: mockUser.role,
            });
            expect(userRepo.create).toHaveBeenCalled();
            expect(userRepo.save).toHaveBeenCalled();
        });

        it('should throw ConflictException when username already exists', async () => {
            userRepo.findOne.mockResolvedValue(mockUser);

            await expect(
                service.register({
                    username: 'admin',
                    password: 'pw',
                    role: Role.ADMIN,
                }),
            ).rejects.toThrow(ConflictException);
        });
    });

    // ── getProfile ──

    describe('getProfile', () => {
        it('should return user profile without password', async () => {
            userRepo.findOne.mockResolvedValue(mockUser);

            const result = await service.getProfile('uuid-1234');

            expect(result).toEqual({
                id: mockUser.id,
                username: mockUser.username,
                role: mockUser.role,
                createdAt: mockUser.createdAt,
            });
        });

        it('should throw UnauthorizedException when user is not found', async () => {
            userRepo.findOne.mockResolvedValue(null);

            await expect(service.getProfile('nonexistent')).rejects.toThrow(
                UnauthorizedException,
            );
        });
    });
});
