import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ExpenseStatus } from '@common/enums/expense-status.enum';

type ReviewableStatus = ExpenseStatus.APPROVED | ExpenseStatus.REJECTED;

const REVIEWABLE_STATUSES: ReviewableStatus[] = [
  ExpenseStatus.APPROVED,
  ExpenseStatus.REJECTED,
];

export class ReviewExpenseDto {
  @IsEnum(REVIEWABLE_STATUSES)
  status!: ReviewableStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
