import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmployeeFormField } from './EmployeeFormField';
import { inputClasses } from '../lib/input-classes';
import type { EmployeeFormState } from '../hooks/useEmployeeFormState';

interface EmployeePayrollCardProps {
    form: EmployeeFormState;
}

export function EmployeePayrollCard({ form }: EmployeePayrollCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Payroll & banking</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 flex items-center gap-4 px-3 py-2.5 rounded-md bg-surface-2">
                    <label className="flex items-center gap-2 text-[12px] text-text-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.epfEligible}
                            onChange={(e) =>
                                form.setEpfEligible(e.target.checked)
                            }
                            className="rounded border-border-strong"
                        />
                        EPF eligible
                    </label>
                    <label className="flex items-center gap-2 text-[12px] text-text-1 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.etfEligible}
                            onChange={(e) =>
                                form.setEtfEligible(e.target.checked)
                            }
                            className="rounded border-border-strong"
                        />
                        ETF eligible
                    </label>
                </div>

                <EmployeeFormField
                    label="EPF number"
                    htmlFor="employee-epf"
                >
                    <input
                        id="employee-epf"
                        value={form.epfNumber}
                        onChange={(e) => form.setEpfNumber(e.target.value)}
                        className={inputClasses(false)}
                        disabled={!form.epfEligible}
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="ETF number"
                    htmlFor="employee-etf"
                >
                    <input
                        id="employee-etf"
                        value={form.etfNumber}
                        onChange={(e) => form.setEtfNumber(e.target.value)}
                        className={inputClasses(false)}
                        disabled={!form.etfEligible}
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Bank name"
                    htmlFor="employee-bank-name"
                >
                    <input
                        id="employee-bank-name"
                        value={form.bankName}
                        onChange={(e) => form.setBankName(e.target.value)}
                        className={inputClasses(false)}
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Branch"
                    htmlFor="employee-bank-branch"
                >
                    <input
                        id="employee-bank-branch"
                        value={form.bankBranch}
                        onChange={(e) => form.setBankBranch(e.target.value)}
                        className={inputClasses(false)}
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Account number"
                    htmlFor="employee-bank-acct-no"
                >
                    <input
                        id="employee-bank-acct-no"
                        value={form.bankAccountNo}
                        onChange={(e) =>
                            form.setBankAccountNo(e.target.value)
                        }
                        className={inputClasses(false)}
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Account holder name"
                    htmlFor="employee-bank-acct-name"
                >
                    <input
                        id="employee-bank-acct-name"
                        value={form.bankAccountName}
                        onChange={(e) =>
                            form.setBankAccountName(e.target.value)
                        }
                        className={inputClasses(false)}
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Notes"
                    htmlFor="employee-notes"
                    className="sm:col-span-2"
                >
                    <textarea
                        id="employee-notes"
                        value={form.notes}
                        onChange={(e) => form.setNotes(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 placeholder:text-text-3 resize-none transition-colors"
                        placeholder="Anything HR should know"
                    />
                </EmployeeFormField>
            </CardContent>
        </Card>
    );
}
