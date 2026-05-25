/**
 * HR employee row as returned by `GET /hr/employees` and friends.
 * Mirrors the Employee entity on the backend; all date columns come
 * back as ISO strings (the `date`-typed columns become `YYYY-MM-DD`
 * and `timestamptz` becomes a full ISO timestamp).
 */
export interface IEmployee {
    id: string;
    employeeCode: string;
    userId: string | null;
    branchId: string;
    fullName: string;
    nameWithInitials: string | null;
    nic: string | null;
    /** ISO date `YYYY-MM-DD`. */
    dateOfBirth: string | null;
    gender: 'Male' | 'Female' | 'Other' | null;
    maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed' | null;
    contactPhone: string;
    contactPhone2: string | null;
    email: string | null;
    permanentAddress: string | null;
    currentAddress: string | null;
    city: string | null;
    emergencyContactName: string | null;
    emergencyContactPhone: string | null;
    emergencyContactRelationship: string | null;
    /** ISO date `YYYY-MM-DD`. */
    hireDate: string;
    /** ISO date `YYYY-MM-DD`. */
    confirmationDate: string | null;
    employeeType: 'Permanent' | 'Contract' | 'Casual' | 'Intern';
    role: string;
    /** `HH:mm:ss` 24-hour. */
    workingHoursStart: string;
    /** `HH:mm:ss` 24-hour. */
    workingHoursEnd: string;
    epfEligible: boolean;
    etfEligible: boolean;
    epfNumber: string | null;
    etfNumber: string | null;
    bankName: string | null;
    bankAccountNo: string | null;
    bankBranch: string | null;
    bankAccountName: string | null;
    status: 'Active' | 'Resigned' | 'Terminated' | 'OnLeave';
    resignationDate: string | null;
    resignationReason: string | null;
    terminationDate: string | null;
    terminationReason: string | null;
    notes: string | null;
    photoUrl: string | null;
    annualLeaveBalance: number;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
}
