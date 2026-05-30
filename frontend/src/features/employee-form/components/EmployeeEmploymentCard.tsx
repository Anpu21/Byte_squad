import { useQuery } from '@tanstack/react-query';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryKeys';
import { UserRole } from '@/constants/enums';
import { useAuth } from '@/hooks/useAuth';
import { EmployeeFormField } from './EmployeeFormField';
import { inputClasses } from '../lib/input-classes';
import type { EmployeeFormState } from '../hooks/useEmployeeFormState';
import type {
    EmployeeStatusField,
    EmployeeTypeField,
} from '../hooks/useEmployeeEmploymentState';

interface EmployeeEmploymentCardProps {
    form: EmployeeFormState;
}

export function EmployeeEmploymentCard({ form }: EmployeeEmploymentCardProps) {
    const { user } = useAuth();
    const isAdmin = user?.role === UserRole.ADMIN;
    const branchesQuery = useQuery({
        queryKey: queryKeys.admin.branches(),
        queryFn: adminService.listBranches,
        staleTime: 5 * 60_000,
        enabled: isAdmin,
    });
    const branches = branchesQuery.data ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Employment</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EmployeeFormField
                    label="Branch"
                    htmlFor="employee-branch"
                    error={form.errors.branchId}
                    required
                >
                    <select
                        id="employee-branch"
                        value={form.branchId}
                        onChange={(e) => form.setBranchId(e.target.value)}
                        aria-invalid={Boolean(form.errors.branchId)}
                        className={inputClasses(Boolean(form.errors.branchId))}
                        disabled={!isAdmin}
                    >
                        <option value="">Select a branch</option>
                        {isAdmin ? (
                            branches.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))
                        ) : (
                            form.branchId && (
                                <option value={form.branchId}>
                                    Your branch
                                </option>
                            )
                        )}
                    </select>
                </EmployeeFormField>

                <EmployeeFormField
                    label="Role"
                    htmlFor="employee-role"
                    error={form.errors.role}
                    required
                >
                    <input
                        id="employee-role"
                        value={form.role}
                        onChange={(e) => form.setRole(e.target.value)}
                        aria-invalid={Boolean(form.errors.role)}
                        className={inputClasses(Boolean(form.errors.role))}
                        placeholder="e.g. Cashier, Stock keeper"
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Employment type"
                    htmlFor="employee-type"
                >
                    <select
                        id="employee-type"
                        value={form.employeeType}
                        onChange={(e) =>
                            form.setEmployeeType(
                                e.target.value as EmployeeTypeField,
                            )
                        }
                        className={inputClasses(false)}
                    >
                        <option value="Permanent">Permanent</option>
                        <option value="Contract">Contract</option>
                        <option value="Casual">Casual</option>
                        <option value="Intern">Intern</option>
                    </select>
                </EmployeeFormField>

                <EmployeeFormField
                    label="Status"
                    htmlFor="employee-status"
                >
                    <select
                        id="employee-status"
                        value={form.status}
                        onChange={(e) =>
                            form.setStatus(
                                e.target.value as EmployeeStatusField,
                            )
                        }
                        className={inputClasses(false)}
                    >
                        <option value="Active">Active</option>
                        <option value="OnLeave">On leave</option>
                        <option value="Resigned">Resigned</option>
                        <option value="Terminated">Terminated</option>
                    </select>
                </EmployeeFormField>

                <EmployeeFormField
                    label="Hire date"
                    htmlFor="employee-hire-date"
                    error={form.errors.hireDate}
                    required
                >
                    <input
                        id="employee-hire-date"
                        type="date"
                        value={form.hireDate}
                        onChange={(e) => form.setHireDate(e.target.value)}
                        aria-invalid={Boolean(form.errors.hireDate)}
                        className={inputClasses(Boolean(form.errors.hireDate))}
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Confirmation date"
                    htmlFor="employee-confirm-date"
                >
                    <input
                        id="employee-confirm-date"
                        type="date"
                        value={form.confirmationDate}
                        onChange={(e) =>
                            form.setConfirmationDate(e.target.value)
                        }
                        className={inputClasses(false)}
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Working hours start"
                    htmlFor="employee-hours-start"
                >
                    <input
                        id="employee-hours-start"
                        type="time"
                        value={form.workingHoursStart}
                        onChange={(e) =>
                            form.setWorkingHoursStart(e.target.value)
                        }
                        className={inputClasses(false)}
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Working hours end"
                    htmlFor="employee-hours-end"
                >
                    <input
                        id="employee-hours-end"
                        type="time"
                        value={form.workingHoursEnd}
                        onChange={(e) =>
                            form.setWorkingHoursEnd(e.target.value)
                        }
                        className={inputClasses(false)}
                    />
                </EmployeeFormField>
            </CardContent>
        </Card>
    );
}
