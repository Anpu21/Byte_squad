import { Injectable } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { User } from '../entities/user.entity';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UserMapper {
    toResponse(user: User): UserResponseDto {
        return plainToClass(UserResponseDto, user, {
            excludeExtraneousValues: true,
        });
    }

    toResponseList(users: User[]): UserResponseDto[] {
        return users.map((user) => this.toResponse(user));
    }
}
