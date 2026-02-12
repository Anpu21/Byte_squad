import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

/**
 * Authentication service handling user validation, login, and registration.
 */
@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
    ) { }

    /**
     * Validates user credentials against the database.
     */
    async validateUser(username: string, password: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { username } });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return user;
    }

    /**
     * Authenticates a user and returns a signed JWT.
     */
    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.username, loginDto.password);

        const payload = {
            sub: user.id,
            username: user.username,
            role: user.role,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        };
    }

    /**
     * Registers a new user. Only accessible by Admins (enforced at controller level).
     */
    async register(registerDto: RegisterDto) {
        const existingUser = await this.userRepository.findOne({
            where: { username: registerDto.username },
        });

        if (existingUser) {
            throw new ConflictException('Username already exists');
        }

        const hashedPassword = await bcrypt.hash(registerDto.password, 10);

        const user = this.userRepository.create({
            username: registerDto.username,
            password: hashedPassword,
            role: registerDto.role,
        });

        const savedUser = await this.userRepository.save(user);

        return {
            id: savedUser.id,
            username: savedUser.username,
            role: savedUser.role,
        };
    }

    /**
     * Retrieves a user profile by ID (excludes password).
     */
    async getProfile(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            username: user.username,
            role: user.role,
            createdAt: user.createdAt,
        };
    }
}
