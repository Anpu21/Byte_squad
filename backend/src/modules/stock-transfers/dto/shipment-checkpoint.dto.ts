import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** A courier waypoint scan appended to a shipment's tracking timeline. */
export class ShipmentCheckpointDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  location!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
