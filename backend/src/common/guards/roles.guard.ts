import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@common/enums/user-roles.enums';
import { ROLES_KEY } from '@common/decorators/roles.decorator';

interface UserPayload {
    id: string;
    email: string;
    role: UserRole;
    branchId: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest<{ user: UserPayload }>();
        const user = request.user;

        return requiredRoles.includes(user.role);
    }
}
