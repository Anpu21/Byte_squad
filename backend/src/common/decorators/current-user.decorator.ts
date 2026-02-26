import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithUser extends Request {
    user: {
        id: string;
        email: string;
        role: string;
        branchId: string;
    };
}

export const CurrentUser = createParamDecorator(
    (data: keyof RequestWithUser['user'] | undefined, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<RequestWithUser>();
        const user = request.user;

        return data ? user[data] : user;
    },
);
