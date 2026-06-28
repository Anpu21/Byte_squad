import { IsNumber, Min } from 'class-validator';

export class SetGroupCartItemQtyDto {
  @IsNumber()
  @Min(0.001)
  quantity!: number;
}
