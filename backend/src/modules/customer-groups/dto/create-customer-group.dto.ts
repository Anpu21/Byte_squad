import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;
}
