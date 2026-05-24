import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { IsSriLankaPhone } from '@common/decorators/is-sri-lanka-phone.decorator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
const EMPTY_TO_UNDEFINED = ({ value }: { value: unknown }): unknown =>
  value === '' ? undefined : value;

/**
 * Body DTO for `POST /hr/employees`. Required columns mirror the
 * non-nullable employee table fields (employeeCode, fullName,
 * contactPhone, hireDate, role, branchId). Everything else is
 * optional — managers can edit later via `PATCH`.
 *
 * Empty strings are normalized to `undefined` on optional fields so
 * the client form library can submit `""` for "leave blank" without
 * polluting the DB with empty strings.
 */
export class CreateEmployeeDto {
  // --- Required identity / scoping -----------------------------------
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  employeeCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  fullName!: string;

  @IsSriLankaPhone()
  contactPhone!: string;

  @IsDateString()
  hireDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  role!: string;

  @IsUUID()
  branchId!: string;

  // --- Optional linkage to an existing login user --------------------
  @IsOptional()
  @IsUUID()
  userId?: string | null;

  // --- Optional identity / demographics ------------------------------
  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  @MaxLength(200)
  nameWithInitials?: string;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  @MaxLength(20)
  nic?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(['Male', 'Female', 'Other'])
  gender?: 'Male' | 'Female' | 'Other';

  @IsOptional()
  @IsEnum(['Single', 'Married', 'Divorced', 'Widowed'])
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';

  // --- Optional contact details --------------------------------------
  @IsOptional()
  @IsSriLankaPhone()
  contactPhone2?: string;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  currentAddress?: string;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  @MaxLength(200)
  emergencyContactName?: string;

  @IsOptional()
  @IsSriLankaPhone()
  emergencyContactPhone?: string;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  @MaxLength(50)
  emergencyContactRelationship?: string;

  // --- Optional employment terms -------------------------------------
  @IsOptional()
  @IsDateString()
  confirmationDate?: string;

  @IsOptional()
  @IsEnum(['Permanent', 'Contract', 'Casual', 'Intern'])
  employeeType?: 'Permanent' | 'Contract' | 'Casual' | 'Intern';

  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'workingHoursStart must be in HH:mm or HH:mm:ss format',
  })
  workingHoursStart?: string;

  @IsOptional()
  @Matches(TIME_REGEX, {
    message: 'workingHoursEnd must be in HH:mm or HH:mm:ss format',
  })
  workingHoursEnd?: string;

  @IsOptional()
  @IsBoolean()
  epfEligible?: boolean;

  @IsOptional()
  @IsBoolean()
  etfEligible?: boolean;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  @MaxLength(50)
  epfNumber?: string;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  @MaxLength(50)
  etfNumber?: string;

  // --- Optional banking ---------------------------------------------
  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  @MaxLength(100)
  bankName?: string;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  @MaxLength(50)
  bankAccountNo?: string;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  @MaxLength(100)
  bankBranch?: string;

  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  @MaxLength(200)
  bankAccountName?: string;

  // --- Optional free-text / leave balance ----------------------------
  @IsOptional()
  @Transform(EMPTY_TO_UNDEFINED)
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  annualLeaveBalance?: number;

  // --- Initial status (rarely set on create) -------------------------
  @IsOptional()
  @IsEnum(['Active', 'Resigned', 'Terminated', 'OnLeave'])
  @MinLength(1)
  status?: 'Active' | 'Resigned' | 'Terminated' | 'OnLeave';
}
