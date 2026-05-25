import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmployeeFormField } from './EmployeeFormField';
import { inputClasses } from '../lib/input-classes';
import type { EmployeeFormState } from '../hooks/useEmployeeFormState';
import type {
    GenderField,
    MaritalField,
} from '../hooks/useEmployeeBasicsState';

interface EmployeeBasicsCardProps {
    form: EmployeeFormState;
}

export function EmployeeBasicsCard({ form }: EmployeeBasicsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Basics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EmployeeFormField
                    label="Employee code"
                    htmlFor="employee-code"
                    error={form.errors.employeeCode}
                    required
                >
                    <input
                        id="employee-code"
                        name="employeeCode"
                        value={form.employeeCode}
                        onChange={(e) => form.setEmployeeCode(e.target.value)}
                        aria-invalid={Boolean(form.errors.employeeCode)}
                        className={inputClasses(Boolean(form.errors.employeeCode))}
                        placeholder="e.g. EMP-0042"
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Full name"
                    htmlFor="employee-full-name"
                    error={form.errors.fullName}
                    required
                >
                    <input
                        id="employee-full-name"
                        name="fullName"
                        value={form.fullName}
                        onChange={(e) => form.setFullName(e.target.value)}
                        aria-invalid={Boolean(form.errors.fullName)}
                        className={inputClasses(Boolean(form.errors.fullName))}
                        placeholder="As on the NIC"
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Name with initials"
                    htmlFor="employee-initials"
                >
                    <input
                        id="employee-initials"
                        value={form.nameWithInitials}
                        onChange={(e) =>
                            form.setNameWithInitials(e.target.value)
                        }
                        className={inputClasses(false)}
                        placeholder="e.g. K. Perera"
                    />
                </EmployeeFormField>

                <EmployeeFormField label="NIC" htmlFor="employee-nic">
                    <input
                        id="employee-nic"
                        value={form.nic}
                        onChange={(e) => form.setNic(e.target.value)}
                        className={inputClasses(false)}
                        placeholder="200012345678 / 88123456V"
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Date of birth"
                    htmlFor="employee-dob"
                >
                    <input
                        id="employee-dob"
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => form.setDateOfBirth(e.target.value)}
                        className={inputClasses(false)}
                    />
                </EmployeeFormField>

                <EmployeeFormField label="Gender" htmlFor="employee-gender">
                    <select
                        id="employee-gender"
                        value={form.gender}
                        onChange={(e) =>
                            form.setGender(e.target.value as GenderField)
                        }
                        className={inputClasses(false)}
                    >
                        <option value="">Prefer not to say</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </EmployeeFormField>

                <EmployeeFormField
                    label="Marital status"
                    htmlFor="employee-marital"
                    className="sm:col-span-2"
                >
                    <select
                        id="employee-marital"
                        value={form.maritalStatus}
                        onChange={(e) =>
                            form.setMaritalStatus(
                                e.target.value as MaritalField,
                            )
                        }
                        className={inputClasses(false)}
                    >
                        <option value="">Not specified</option>
                        <option value="Single">Single</option>
                        <option value="Married">Married</option>
                        <option value="Divorced">Divorced</option>
                        <option value="Widowed">Widowed</option>
                    </select>
                </EmployeeFormField>
            </CardContent>
        </Card>
    );
}
