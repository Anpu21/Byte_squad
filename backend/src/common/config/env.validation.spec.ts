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

  it('refuses to boot production without an RS256 signing key', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        CORS_ORIGIN: 'https://app.example.com',
      }),
    ).toThrow(/JWT_PRIVATE_KEY/);
  });

  it('refuses to boot production without an explicit key id', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_PRIVATE_KEY: 'pem-material',
        CORS_ORIGIN: 'https://app.example.com',
      }),
    ).toThrow(/JWT_KEY_ID/);
  });

  it('refuses to boot production without an explicit CORS_ORIGIN', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_PRIVATE_KEY: 'pem-material',
        JWT_KEY_ID: 'kid-2026-06',
      }),
    ).toThrow(/CORS_ORIGIN must be set/);
  });

  it('refuses to boot production with DB_SYNC enabled', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_PRIVATE_KEY: 'pem-material',
        JWT_KEY_ID: 'kid-2026-06',
        CORS_ORIGIN: 'https://app.example.com',
        DB_SYNC: 'true',
      }),
    ).toThrow(/DB_SYNC must not be enabled/);
  });

  it('accepts a hardened production config', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_PRIVATE_KEY: 'pem-material',
        JWT_KEY_ID: 'kid-2026-06',
        CORS_ORIGIN: 'https://app.example.com',
      }),
    ).not.toThrow();
  });
});
