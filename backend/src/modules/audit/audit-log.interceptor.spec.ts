/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuditLogInterceptor } from './audit-log.interceptor';
import { AuditLogRepository } from './audit-log.repository';

function makeContext(opts: {
  method: string;
  path: string;
  user?: { id: string; role: string; branchId: string | null };
  statusCode?: number;
}): ExecutionContext {
  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => ({
        method: opts.method,
        path: opts.path,
        url: opts.path,
        user: opts.user,
      }),
      getResponse: () => ({ statusCode: opts.statusCode ?? 201 }),
    }),
  } as unknown as ExecutionContext;
}

const okHandler: CallHandler = { handle: () => of({ ok: true }) };

describe('AuditLogInterceptor', () => {
  let interceptor: AuditLogInterceptor;
  let repo: jest.Mocked<AuditLogRepository>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuditLogInterceptor,
        {
          provide: AuditLogRepository,
          useValue: { insert: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();
    interceptor = moduleRef.get(AuditLogInterceptor);
    repo = moduleRef.get(AuditLogRepository);
  });

  it('logs mutating calls with actor, path, and status', async () => {
    const ctx = makeContext({
      method: 'POST',
      path: '/api/v1/pos/sales',
      user: { id: 'u1', role: 'cashier', branchId: 'b1' },
    });
    await firstValueFrom(interceptor.intercept(ctx, okHandler));

    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        userRole: 'cashier',
        method: 'POST',
        path: '/api/v1/pos/sales',
        statusCode: 201,
        branchId: 'b1',
      }),
    );
  });

  it('ignores reads', async () => {
    const ctx = makeContext({ method: 'GET', path: '/api/v1/pos/sales' });
    await firstValueFrom(interceptor.intercept(ctx, okHandler));
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('skips auth endpoints (credentials, noise)', async () => {
    const ctx = makeContext({ method: 'POST', path: '/api/v1/auth/login' });
    await firstValueFrom(interceptor.intercept(ctx, okHandler));
    expect(repo.insert).not.toHaveBeenCalled();
  });

  it('logs the error status and rethrows on failure', async () => {
    const ctx = makeContext({
      method: 'PATCH',
      path: '/api/v1/hr/leaves/1/approve',
      user: { id: 'u2', role: 'manager', branchId: 'b1' },
    });
    const failing: CallHandler = {
      handle: () => throwError(() => ({ status: 403, getStatus: () => 403 })),
    };
    await expect(
      firstValueFrom(interceptor.intercept(ctx, failing)),
    ).rejects.toBeDefined();
    expect(repo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it('never breaks the request when the audit write fails', async () => {
    repo.insert.mockRejectedValue(new Error('db down'));
    const ctx = makeContext({
      method: 'POST',
      path: '/api/v1/pos/sales',
      user: { id: 'u1', role: 'cashier', branchId: null },
    });
    await expect(
      firstValueFrom(interceptor.intercept(ctx, okHandler)),
    ).resolves.toEqual({ ok: true });
  });
});
