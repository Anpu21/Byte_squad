/**
 * Write-side payload for `POST /hr/employees`. Matches the BE
 * `CreateEmployeeDto` class-validator shape. Optional fields are
 * left off the wire when blank; the BE normalises empty strings to
 * `undefined` on its end as well, so we are tolerant either way.
 */
export interface IEmployeePayload {
    // Required identity / scoping
    employeeCode: string;
    branchId: string;
    fullName: string;
    contactPhone: string;
    /** ISO date `YYYY-MM-DD`. */
    hireDate: string;
    role: string;

    // Optional linkage to a login user
    userId?: string | null;

    // Optional identity / demographics
    nameWithInitials?: string;
    nic?: string;
    /** ISO date `YYYY-MM-DD`. */
    dateOfBirth?: string;
    gender?: 'Male' | 'Female' | 'Other';
    maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';

    // Optional contact details
    contactPhone2?: string;
    email?: string;
    permanentAddress?: string;
    currentAddress?: string;
    city?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;

    // Optional employment terms
    /** ISO date `YYYY-MM-DD`. */
    confirmationDate?: string;
    employeeType?: 'Permanent' | 'Contract' | 'Casual' | 'Intern';
    /** `HH:mm` or `HH:mm:ss`. */
    workingHoursStart?: string;
    /** `HH:mm` or `HH:mm:ss`. */
    workingHoursEnd?: string;
    epfEligible?: boolean;
    etfEligible?: boolean;
    epfNumber?: string;
    etfNumber?: string;

    // Optional banking
    bankName?: string;
    bankAccountNo?: string;
    bankBranch?: string;
    bankAccountName?: string;

    // Optional free-text + initial state
    notes?: string;
    annualLeaveBalance?: number;
    status?: 'Active' | 'Resigned' | 'Terminated' | 'OnLeave';
}
