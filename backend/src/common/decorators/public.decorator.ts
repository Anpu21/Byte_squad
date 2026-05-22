import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

// Marks a route as unauthenticated. Use only on endpoints that genuinely
// have no caller identity (login, signup, password reset, OTP).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
