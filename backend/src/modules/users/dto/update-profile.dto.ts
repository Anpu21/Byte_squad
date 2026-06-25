import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsSriLankaPhone } from '@common/decorators/is-sri-lanka-phone.decorator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  lastName?: string;

  @IsOptional()
  @IsSriLankaPhone()
  phone?: string | null;

  /** Preferred UI language. Kept in lockstep with the frontend's
   * SUPPORTED_LANGUAGES (`frontend/src/i18n/config.ts`). */
  @IsOptional()
  @IsIn(['en', 'ta'])
  language?: string;
}
