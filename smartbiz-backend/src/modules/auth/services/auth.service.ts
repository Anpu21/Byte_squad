import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@modules/users/services/user.service';
import { UserRepository } from '@modules/users/repositories/user.repository';
import { User } from '@modules/users/entities/user.entity';
import { LoginDto } from '../dto/login.dto';
import { TokenResponseDto } from '../dto/token-response.dto';

export interface JwtPayload {
    sub: string;
    username: string;
    email: string;
    role: string;
    companyId: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly userRepository: UserRepository,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async validateUser(username: string, password: string): Promise<User | null> {
        const user = await this.userService.findByUsername(username);

        if (!user || !user.isActive) {
            return null;
        }

        const isPasswordValid = await this.userService.validatePassword(user, password);

        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    async login(loginDto: LoginDto): Promise<TokenResponseDto> {
        const user = await this.validateUser(loginDto.username, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        // Update last login
        await this.userRepository.updateLastLogin(user.id);

        // Generate tokens
        const tokens = await this.generateTokens(user);

        // Save refresh token
        await this.userRepository.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    async logout(userId: string): Promise<void> {
        await this.userRepository.updateRefreshToken(userId, null);
    }

    async refreshTokens(userId: string, refreshToken: string): Promise<TokenResponseDto> {
        const user = await this.userRepository.findById(userId);

        if (!user || !user.refreshToken) {
            throw new UnauthorizedException('Access denied');
        }

        if (user.refreshToken !== refreshToken) {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const tokens = await this.generateTokens(user);
        await this.userRepository.updateRefreshToken(user.id, tokens.refreshToken);

        return tokens;
    }

    private async generateTokens(user: User): Promise<TokenResponseDto> {
        const payload: JwtPayload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            role: user.role?.name || 'MANAGER',
            companyId: user.companyId,
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(payload),
            this.jwtService.signAsync(payload, {
                expiresIn: this.configService.get<string>('app.jwt.refreshExpiresIn'),
            }),
        ]);

        return {
            accessToken,
            refreshToken,
            expiresIn: this.configService.get<string>('app.jwt.expiresIn'),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role?.name,
                companyId: user.companyId,
            },
        };
    }
}
