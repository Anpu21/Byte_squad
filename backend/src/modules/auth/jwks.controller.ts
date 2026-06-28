import { Controller, Get } from '@nestjs/common';
import { APP_ROUTES } from '@common/routes/app.routes';
import { Public } from '@common/decorators/public.decorator';
import { SkipTransform } from '@common/decorators/skip-transform.decorator';
import { JwksService } from '@auth/jwks.service';

/**
 * Public JWKS document so other services (e.g. the chatbot) can verify
 * RS256-signed access tokens without a shared secret. Intentionally NOT under
 * the API prefix and NOT wrapped by the success envelope — standard JWKS
 * clients expect the raw `{ keys: [...] }` shape at /.well-known/jwks.json.
 */
@Controller(APP_ROUTES.WELL_KNOWN.JWKS)
export class JwksController {
  constructor(private readonly jwksService: JwksService) {}

  @Public()
  @SkipTransform()
  @Get()
  getJwks() {
    return this.jwksService.getJwks();
  }
}
