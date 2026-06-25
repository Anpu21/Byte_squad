import { IsNumber, Max, Min } from 'class-validator';

export class OpenShiftDto {
  /** Cash placed in the drawer at the start of the session. */
  @IsNumber()
  @Min(0)
  @Max(1_000_000)
  openingFloat!: number;
}
