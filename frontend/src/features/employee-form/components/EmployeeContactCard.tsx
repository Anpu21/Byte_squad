import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmployeeFormField } from './EmployeeFormField';
import { inputClasses } from '../lib/input-classes';
import type { EmployeeFormState } from '../hooks/useEmployeeFormState';

interface EmployeeContactCardProps {
    form: EmployeeFormState;
}

export function EmployeeContactCard({ form }: EmployeeContactCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EmployeeFormField
                    label="Primary phone"
                    htmlFor="employee-phone"
                    error={form.errors.contactPhone}
                    required
                    hint="Sri Lanka format, e.g. +94770000000"
                >
                    <input
                        id="employee-phone"
                        type="tel"
                        value={form.contactPhone}
                        onChange={(e) => form.setContactPhone(e.target.value)}
                        aria-invalid={Boolean(form.errors.contactPhone)}
                        className={inputClasses(Boolean(form.errors.contactPhone))}
                        placeholder="+94770000000"
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Secondary phone"
                    htmlFor="employee-phone-2"
                >
                    <input
                        id="employee-phone-2"
                        type="tel"
                        value={form.contactPhone2}
                        onChange={(e) => form.setContactPhone2(e.target.value)}
                        className={inputClasses(false)}
                        placeholder="Optional"
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Email"
                    htmlFor="employee-email"
                    error={form.errors.email}
                    className="sm:col-span-2"
                >
                    <input
                        id="employee-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => form.setEmail(e.target.value)}
                        aria-invalid={Boolean(form.errors.email)}
                        className={inputClasses(Boolean(form.errors.email))}
                        placeholder="name@example.com"
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Permanent address"
                    htmlFor="employee-perm-address"
                    className="sm:col-span-2"
                >
                    <textarea
                        id="employee-perm-address"
                        value={form.permanentAddress}
                        onChange={(e) =>
                            form.setPermanentAddress(e.target.value)
                        }
                        rows={2}
                        className="w-full px-3 py-2 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 placeholder:text-text-3 resize-none transition-colors"
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Current address"
                    htmlFor="employee-cur-address"
                    className="sm:col-span-2"
                >
                    <textarea
                        id="employee-cur-address"
                        value={form.currentAddress}
                        onChange={(e) =>
                            form.setCurrentAddress(e.target.value)
                        }
                        rows={2}
                        className="w-full px-3 py-2 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 placeholder:text-text-3 resize-none transition-colors"
                    />
                </EmployeeFormField>

                <EmployeeFormField label="City" htmlFor="employee-city">
                    <input
                        id="employee-city"
                        value={form.city}
                        onChange={(e) => form.setCity(e.target.value)}
                        className={inputClasses(false)}
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Emergency contact name"
                    htmlFor="employee-ec-name"
                >
                    <input
                        id="employee-ec-name"
                        value={form.emergencyContactName}
                        onChange={(e) =>
                            form.setEmergencyContactName(e.target.value)
                        }
                        className={inputClasses(false)}
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Emergency contact phone"
                    htmlFor="employee-ec-phone"
                >
                    <input
                        id="employee-ec-phone"
                        type="tel"
                        value={form.emergencyContactPhone}
                        onChange={(e) =>
                            form.setEmergencyContactPhone(e.target.value)
                        }
                        className={inputClasses(false)}
                        placeholder="+94770000000"
                    />
                </EmployeeFormField>

                <EmployeeFormField
                    label="Relationship"
                    htmlFor="employee-ec-rel"
                >
                    <input
                        id="employee-ec-rel"
                        value={form.emergencyContactRelationship}
                        onChange={(e) =>
                            form.setEmergencyContactRelationship(e.target.value)
                        }
                        className={inputClasses(false)}
                        placeholder="e.g. Spouse"
                    />
                </EmployeeFormField>
            </CardContent>
        </Card>
    );
}
