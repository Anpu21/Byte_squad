/**
 * DI token for the ioredis publisher client. The provider resolves to `null`
 * when REDIS_URL is unset, so the publisher degrades to in-process-only without
 * breaking boot (see realtime.module.ts).
 */
export const REDIS_PUBLISHER = Symbol('REDIS_PUBLISHER');
