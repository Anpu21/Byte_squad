import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/user.repository';
import { RoleRepository } from '../repositories/role.repository';
import { CreateUserDto, UpdateUserDto } from '../dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
    private readonly SALT_ROUNDS = 10;

    constructor(
        private readonly userRepository: UserRepository,
        private readonly roleRepository: RoleRepository,
    ) { }

    async findAll(): Promise<User[]> {
        return this.userRepository.findAll();
    }

    async findById(id: string): Promise<User> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.userRepository.findByUsername(username);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findByEmail(email);
    }

    async findByCompany(companyId: string): Promise<User[]> {
        return this.userRepository.findByCompany(companyId);
    }

    async create(createUserDto: CreateUserDto): Promise<User> {
        // Check for existing username
        if (await this.userRepository.existsByUsername(createUserDto.username)) {
            throw new ConflictException('Username already exists');
        }

        // Check for existing email
        if (await this.userRepository.existsByEmail(createUserDto.email)) {
            throw new ConflictException('Email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(
            createUserDto.password,
            this.SALT_ROUNDS,
        );

        return this.userRepository.create({
            ...createUserDto,
            password: hashedPassword,
        });
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findById(id);

        // Check email uniqueness if changing
        if (updateUserDto.email && updateUserDto.email !== user.email) {
            if (await this.userRepository.existsByEmail(updateUserDto.email)) {
                throw new ConflictException('Email already exists');
            }
        }

        // Hash password if provided
        const updateData: Partial<User> = { ...updateUserDto };
        if (updateUserDto.password) {
            updateData.password = await bcrypt.hash(
                updateUserDto.password,
                this.SALT_ROUNDS,
            );
        }

        return this.userRepository.update(id, updateData);
    }

    async delete(id: string): Promise<void> {
        await this.findById(id);
        await this.userRepository.softDelete(id);
    }

    async validatePassword(user: User, password: string): Promise<boolean> {
        return bcrypt.compare(password, user.password);
    }

    async seedDefaultRoles(): Promise<void> {
        await this.roleRepository.seedDefaultRoles();
    }
}
