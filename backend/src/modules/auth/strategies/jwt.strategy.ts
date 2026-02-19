import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../../../../shared/constants/enums.js';

interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
    branchId: string;
}

interface ValidatedUser {
    id: string;
    email: string;
    role: UserRole;
    branchId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        const secretOrKey = configService.get<string>(
            'JWT_SECRET',
            'ledgerpro-dev-secret-change-me',
        );

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey,
        });
    }

    validate(payload: JwtPayload): ValidatedUser {
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            branchId: payload.branchId,
        };
    }
}
