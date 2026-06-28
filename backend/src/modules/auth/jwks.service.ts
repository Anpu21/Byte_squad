import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getJwtKeyConfig, JwtPublicJwk } from '@common/config/jwt.config';

export interface Jwks {
  keys: JwtPublicJwk[];
}

/** Serves the public JWKS document used to verify RS256 access tokens. */
@Injectable()
export class JwksService {
  private readonly jwks: Jwks;

  constructor(configService: ConfigService) {
    this.jwks = { keys: [getJwtKeyConfig(configService).publicJwk] };
  }

  getJwks(): Jwks {
    return this.jwks;
  }
}
