import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getJwtKeyConfig, resetJwtKeyConfigCache } from './jwt.config';

// Returns the provided default for every key → NODE_ENV undefined (dev) and no
// key material, so an ephemeral RS256 keypair is generated.
function devConfig(): ConfigService {
  return {
    get: jest.fn((_key: string, def?: unknown) => def),
  } as unknown as ConfigService;
}

describe('getJwtKeyConfig', () => {
  beforeEach(() => resetJwtKeyConfigCache());

  it('generates an RS256 keypair and a well-formed public JWK in dev', () => {
    const keys = getJwtKeyConfig(devConfig());

    expect(keys.algorithm).toBe('RS256');
    expect(keys.privateKey).toContain('BEGIN PRIVATE KEY');
    expect(keys.publicKey).toContain('BEGIN PUBLIC KEY');
    expect(keys.issuer).toBe('ledgerpro-backend');
    expect(keys.audience).toBe('ledgerpro-api');
    expect(keys.publicJwk).toMatchObject({
      kty: 'RSA',
      use: 'sig',
      alg: 'RS256',
      kid: keys.kid,
    });
    expect(keys.publicJwk.n.length).toBeGreaterThan(10);
  });

  it('signs an access token that verifies against the public key (kid + iss/aud)', () => {
    const keys = getJwtKeyConfig(devConfig());
    const jwtService = new JwtService({
      privateKey: keys.privateKey,
      publicKey: keys.publicKey,
      signOptions: {
        algorithm: keys.algorithm,
        keyid: keys.kid,
        issuer: keys.issuer,
        audience: keys.audience,
      },
      verifyOptions: {
        algorithms: [keys.algorithm],
        issuer: keys.issuer,
        audience: keys.audience,
      },
    });

    const token = jwtService.sign({ sub: 'user-1' });

    const header = JSON.parse(
      Buffer.from(token.split('.')[0], 'base64url').toString('utf8'),
    ) as { alg: string; kid: string };
    expect(header.alg).toBe('RS256');
    expect(header.kid).toBe(keys.kid);

    const decoded = jwtService.verify<{
      sub: string;
      iss: string;
      aud: string;
    }>(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.iss).toBe(keys.issuer);
    expect(decoded.aud).toBe(keys.audience);
  });

  it('rejects a token signed by a different key (RS256 integrity)', () => {
    const keys = getJwtKeyConfig(devConfig());
    resetJwtKeyConfigCache();
    const otherKeys = getJwtKeyConfig(devConfig());

    const signer = new JwtService({
      privateKey: otherKeys.privateKey,
      publicKey: otherKeys.publicKey,
      signOptions: { algorithm: 'RS256' },
    });
    const verifier = new JwtService({
      publicKey: keys.publicKey,
      verifyOptions: { algorithms: ['RS256'] },
    });

    const foreign = signer.sign({ sub: 'evil' });
    expect(() => {
      verifier.verify(foreign);
    }).toThrow();
  });
});
