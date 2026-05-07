import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import type { ValidatedCustomer } from '@/modules/customers/strategies/customer-jwt.strategy';

interface RequestWithCustomer extends Request {
  user?: ValidatedCustomer;
}

export const CurrentCustomer = createParamDecorator(
  (
    data: keyof ValidatedCustomer | undefined,
    ctx: ExecutionContext,
  ): ValidatedCustomer | string | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithCustomer>();
    const customer = request.user ?? null;
    if (!customer) return null;
    return data ? customer[data] : customer;
  },
);
