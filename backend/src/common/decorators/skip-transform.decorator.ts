import { SetMetadata } from '@nestjs/common';

export const SKIP_TRANSFORM_KEY = 'skipTransform';

/**
 * Opt a route out of the global success-envelope wrapper (TransformInterceptor)
 * so it returns its raw body. Use only where a standard external shape is
 * required — e.g. the JWKS document.
 */
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
