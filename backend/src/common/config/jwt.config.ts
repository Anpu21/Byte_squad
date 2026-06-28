import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createPublicKey, generateKeyPairSync } from 'crypto';

/**
 * RS256 JWT key material + claims, resolved once per process.
 *
 * Access tokens are signed with the RSA private key; any service (e.g. the
 * chatbot) verifies them with the public key published at the JWKS endpoint —
 * no shared signing secret. In non-production the keypair is generated on boot
 * so the API runs with zero config; production MUST supply `JWT_PRIVATE_KEY`
 * (enforced in env.validation).
 */
export interface JwtPublicJwk {
  kty: string;
  n: string;
  e: string;
  kid: string;
  use: 'sig';
  alg: 'RS256';
}

export interface JwtKeyConfig {
  privateKey: string;
  publicKey: string;
  kid: string;
  issuer: string;
  audience: string;
  algorithm: 'RS256';
  accessExpiresIn: string;
  refreshExpiresIn: string;
  publicJwk: JwtPublicJwk;
}

const logger = new Logger('JwtKeyConfig');

const DEFAULT_ISSUER = 'ledgerpro-backend';
const DEFAULT_AUDIENCE = 'ledgerpro-api';

let cached: JwtKeyConfig | null = null;

/** Accept either a raw PEM or a base64-encoded PEM (env / secret-store friendly). */
function decodePem(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.includes('-----BEGIN')
    ? trimmed
    : Buffer.from(trimmed, 'base64').toString('utf8');
}

function derivePublicPem(privatePem: string): string {
  return createPublicKey(privatePem)
    .export({ type: 'spki', format: 'pem' })
    .toString();
}

export function getJwtKeyConfig(configService: ConfigService): JwtKeyConfig {
  if (cached) {
    return cached;
  }

  const isProduction =
    (configService.get<string>('NODE_ENV') ?? 'development') === 'production';

  const privateRaw = configService.get<string>('JWT_PRIVATE_KEY');
  const publicRaw = configService.get<string>('JWT_PUBLIC_KEY');

  let privateKey: string;
  let publicKey: string;

  if (privateRaw) {
    privateKey = decodePem(privateRaw);
    publicKey = publicRaw ? decodePem(publicRaw) : derivePublicPem(privateKey);
  } else if (!isProduction) {
    // Process-stable ephemeral keypair so dev boots config-free. Tokens do not
    // survive a restart; never used in production (env.validation guards).
    const pair = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    privateKey = pair.privateKey;
    publicKey = pair.publicKey;
    logger.warn(
      'JWT_PRIVATE_KEY not set — generated an ephemeral RS256 dev keypair. ' +
        'Set JWT_PRIVATE_KEY (and JWT_KEY_ID) in production.',
    );
  } else {
    throw new Error(
      'JWT_PRIVATE_KEY must be set in production (RS256 signing key).',
    );
  }

  const jwk = createPublicKey(publicKey).export({ format: 'jwk' }) as {
    kty?: string;
    n?: string;
    e?: string;
  };
  const kid =
    configService.get<string>('JWT_KEY_ID') ??
    createHash('sha256')
      .update(jwk.n ?? publicKey)
      .digest('hex')
      .slice(0, 16);

  cached = {
    privateKey,
    publicKey,
    kid,
    issuer: configService.get<string>('JWT_ISSUER', DEFAULT_ISSUER),
    audience: configService.get<string>('JWT_AUDIENCE', DEFAULT_AUDIENCE),
    algorithm: 'RS256',
    accessExpiresIn: configService.get<string>('JWT_EXPIRES_IN', '1d'),
    refreshExpiresIn: configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    ),
    publicJwk: {
      kty: jwk.kty ?? 'RSA',
      n: jwk.n ?? '',
      e: jwk.e ?? 'AQAB',
      kid,
      use: 'sig',
      alg: 'RS256',
    },
  };

  return cached;
}

/** Test helper — clears the process-level cache between suites. */
export function resetJwtKeyConfigCache(): void {
  cached = null;
}
