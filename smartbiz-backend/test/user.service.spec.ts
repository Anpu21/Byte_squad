import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../../src/modules/users/services/user.service';
import { UserRepository } from '../../src/modules/users/repositories/user.repository';
import { RoleRepository } from '../../src/modules/users/repositories/role.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('UserService', () => {
    let service: UserService;
    let userRepository: UserRepository;
    let roleRepository: RoleRepository;

    const mockUser = {
        id: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        roleId: 'role-123',
        companyId: 'company-123',
        isActive: true,
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserService,
                {
                    provide: UserRepository,
                    useValue: {
                        findAll: jest.fn().mockResolvedValue([mockUser]),
                        findById: jest.fn().mockResolvedValue(mockUser),
                        findByUsername: jest.fn(),
                        findByEmail: jest.fn(),
                        findByCompany: jest.fn().mockResolvedValue([mockUser]),
                        create: jest.fn().mockResolvedValue(mockUser),
                        update: jest.fn().mockResolvedValue(mockUser),
                        delete: jest.fn().mockResolvedValue(true),
                        softDelete: jest.fn().mockResolvedValue(true),
                        existsByUsername: jest.fn(),
                        existsByEmail: jest.fn(),
                    },
                },
                {
                    provide: RoleRepository,
                    useValue: {
                        findAll: jest.fn(),
                        findById: jest.fn(),
                        seedDefaultRoles: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        userRepository = module.get<UserRepository>(UserRepository);
        roleRepository = module.get<RoleRepository>(RoleRepository);
    });

    describe('findAll', () => {
        it('should return all users', async () => {
            const result = await service.findAll();
            expect(result).toEqual([mockUser]);
            expect(userRepository.findAll).toHaveBeenCalled();
        });
    });

    describe('findById', () => {
        it('should return a user by id', async () => {
            const result = await service.findById('user-123');
            expect(result).toEqual(mockUser);
        });

        it('should throw NotFoundException if user not found', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

            await expect(service.findById('invalid-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('create', () => {
        const createDto = {
            username: 'newuser',
            email: 'new@example.com',
            password: 'password123',
            firstName: 'New',
            lastName: 'User',
            roleId: 'role-123',
            companyId: 'company-123',
        };

        it('should create a new user with hashed password', async () => {
            jest.spyOn(userRepository, 'existsByUsername').mockResolvedValue(false);
            jest.spyOn(userRepository, 'existsByEmail').mockResolvedValue(false);

            const result = await service.create(createDto);

            expect(result).toBeDefined();
            expect(userRepository.create).toHaveBeenCalled();
        });

        it('should throw ConflictException if username exists', async () => {
            jest.spyOn(userRepository, 'existsByUsername').mockResolvedValue(true);

            await expect(service.create(createDto)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should throw ConflictException if email exists', async () => {
            jest.spyOn(userRepository, 'existsByUsername').mockResolvedValue(false);
            jest.spyOn(userRepository, 'existsByEmail').mockResolvedValue(true);

            await expect(service.create(createDto)).rejects.toThrow(
                ConflictException,
            );
        });
    });

    describe('delete', () => {
        it('should soft delete a user', async () => {
            await service.delete('user-123');

            expect(userRepository.softDelete).toHaveBeenCalledWith('user-123');
        });

        it('should throw NotFoundException if user not found', async () => {
            jest.spyOn(userRepository, 'findById').mockResolvedValue(null);

            await expect(service.delete('invalid-id')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
