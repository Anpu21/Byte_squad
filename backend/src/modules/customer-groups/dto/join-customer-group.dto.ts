import { IsString, MaxLength, MinLength } from 'class-validator';

export class JoinCustomerGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(24)
  joinCode!: string;
}
