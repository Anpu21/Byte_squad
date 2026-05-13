import { IsUUID } from 'class-validator';

export class UpdateMyBranchDto {
  @IsUUID()
  branchId!: string;
}
