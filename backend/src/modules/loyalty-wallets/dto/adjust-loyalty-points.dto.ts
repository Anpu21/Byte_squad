import { IsInt, IsNotEmpty, IsString, NotEquals } from 'class-validator';

export class AdjustLoyaltyPointsDto {
  @IsInt()
  @NotEquals(0, { message: 'Points adjustment cannot be 0' })
  points!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
