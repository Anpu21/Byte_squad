import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

/**
 * Known environment variables. Every field is optional so local dev still boots
 * from the in-code defaults (Postgres on localhost, an ephemeral RS256 dev
 * keypair), but any value that IS supplied must be well-formed — a malformed
 * PORT or an unknown NODE_ENV fails the boot instead of surfacing deep inside a
 * request. Production additionally requires real secrets (see
 * {@link validateEnv}).
 */
class EnvironmentVariables {
  @IsOptional()
  @IsEnum(NodeEnv)
  NODE_ENV?: NodeEnv;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsOptional()
  @IsString()
  DB_HOST?: string;

  @IsOptional()
  @IsNumberString()
  DB_PORT?: string;

  @IsOptional()
  @IsString()
  DB_USERNAME?: string;

  @IsOptional()
  @IsString()
  DB_PASSWORD?: string;

  @IsOptional()
  @IsString()
  DB_NAME?: string;

  @IsOptional()
  @IsString()
  DB_SYNC?: string;

  @IsOptional()
  @IsString()
  JWT_PRIVATE_KEY?: string;

  @IsOptional()
  @IsString()
  JWT_PUBLIC_KEY?: string;

  @IsOptional()
  @IsString()
  JWT_KEY_ID?: string;

  @IsOptional()
  @IsString()
  JWT_ISSUER?: string;

  @IsOptional()
  @IsString()
  JWT_AUDIENCE?: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  JWT_REFRESH_EXPIRES_IN?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;
}

/**
 * ConfigModule `validate` hook. Throws (aborting boot) when any provided value
 * is malformed, or when production is missing the hardened secrets it requires.
 * Returns the raw env unchanged so namespaced `registerAs` configs keep reading
 * the same values.
 */
export function validateEnv(
  raw: Record<string, unknown>,
): Record<string, unknown> {
  const parsed = plainToInstance(EnvironmentVariables, raw);

  const errors = validateSync(parsed, { skipMissingProperties: true });
  if (errors.length > 0) {
    const detail = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${detail}`);
  }

  if (parsed.NODE_ENV === NodeEnv.Production) {
    if (!parsed.JWT_PRIVATE_KEY) {
      throw new Error(
        'JWT_PRIVATE_KEY (RS256 PEM) must be set in production; the ephemeral dev keypair is not allowed.',
      );
    }
    if (!parsed.JWT_KEY_ID) {
      throw new Error(
        'JWT_KEY_ID must be set in production so JWKS consumers can pin the signing key.',
      );
    }
    if (!parsed.CORS_ORIGIN) {
      throw new Error('CORS_ORIGIN must be set explicitly in production.');
    }
    if (parsed.DB_SYNC === 'true') {
      throw new Error(
        'DB_SYNC must not be enabled in production — schema auto-sync is destructive.',
      );
    }
  }

  return raw;
}
