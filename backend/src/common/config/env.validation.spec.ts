import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  it('accepts an empty (local-dev) env and returns it unchanged', () => {
    const raw = {};
    expect(validateEnv(raw)).toBe(raw);
  });

  it('accepts well-formed values', () => {
    expect(() =>
      validateEnv({ NODE_ENV: 'development', PORT: '3000', DB_PORT: '5432' }),
    ).not.toThrow();
  });

  it('rejects a non-numeric PORT', () => {
    expect(() => validateEnv({ PORT: 'not-a-number' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ NODE_ENV: 'prod' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('rejects a too-short JWT_SECRET when provided', () => {
    expect(() => validateEnv({ JWT_SECRET: 'short' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('refuses to boot production on the shipped dev secret', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'ledgerpro-dev-secret-change-me',
        CORS_ORIGIN: 'https://app.example.com',
      }),
    ).toThrow(/JWT_SECRET must be a strong/);
  });

  it('refuses to boot production without an explicit CORS_ORIGIN', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-genuinely-strong-production-secret-value-1234',
      }),
    ).toThrow(/CORS_ORIGIN must be set/);
  });

  it('refuses to boot production with DB_SYNC enabled', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-genuinely-strong-production-secret-value-1234',
        CORS_ORIGIN: 'https://app.example.com',
        DB_SYNC: 'true',
      }),
    ).toThrow(/DB_SYNC must not be enabled/);
  });

  it('accepts a hardened production config', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-genuinely-strong-production-secret-value-1234',
        CORS_ORIGIN: 'https://app.example.com',
      }),
    ).not.toThrow();
  });
});
