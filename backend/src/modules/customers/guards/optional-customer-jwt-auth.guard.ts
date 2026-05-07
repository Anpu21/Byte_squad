import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { ValidatedCustomer } from '@/modules/customers/strategies/customer-jwt.strategy';

@Injectable()
export class OptionalCustomerJwtAuthGuard extends AuthGuard('customer-jwt') {
  override handleRequest<TUser = ValidatedCustomer>(
    _err: unknown,
    user: TUser | false,
  ): TUser | null {
    return user ? (user as TUser) : null;
  }
}
