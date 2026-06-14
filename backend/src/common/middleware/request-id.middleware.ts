import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'X-Request-Id';

/** An incoming request stamped with a correlation id. */
export interface RequestWithId extends Request {
  id?: string;
}

/**
 * Stamp every request with a correlation id — reuse an inbound `X-Request-Id`
 * (e.g. from an upstream proxy/load balancer) or mint a new UUID — and echo it
 * back on the response so a client and the server logs can be traced together.
 */
export function requestIdMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
): void {
  const inbound = req.headers['x-request-id'];
  const id =
    typeof inbound === 'string' && inbound.trim().length > 0
      ? inbound.trim()
      : randomUUID();
  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  next();
}
