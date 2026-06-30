import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ModerateReviewDto {
  /** Optional note kept on the review for the moderation trail. */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
