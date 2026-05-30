import { useEmployeeFormPage } from '@/features/employee-form/hooks/useEmployeeFormPage';
import { EmployeeFormHeader } from '@/features/employee-form/components/EmployeeFormHeader';
import { EmployeeBasicsCard } from '@/features/employee-form/components/EmployeeBasicsCard';
import { EmployeeContactCard } from '@/features/employee-form/components/EmployeeContactCard';
import { EmployeeEmploymentCard } from '@/features/employee-form/components/EmployeeEmploymentCard';
import { EmployeePayrollCard } from '@/features/employee-form/components/EmployeePayrollCard';
import { EmployeePhotoCard } from '@/features/employee-form/components/EmployeePhotoCard';

export function AdminEmployeeFormPage() {
    const p = useEmployeeFormPage();
    const { form } = p;

    if (p.isLoadingEmployee) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-border-strong border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <EmployeeFormHeader
                isEditMode={p.isEditMode}
                isSubmitting={p.isSubmitting}
            />

            {form.errors.general && (
                <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
                    {form.errors.general}
                </div>
            )}

            <form
                id="employee-form"
                onSubmit={p.handleSubmit}
                className="grid grid-cols-1 lg:grid-cols-3 gap-4"
            >
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <EmployeeBasicsCard form={form} />
                    <EmployeeContactCard form={form} />
                    <EmployeeEmploymentCard form={form} />
                    <EmployeePayrollCard form={form} />
                </div>
                <div className="flex flex-col gap-4">
                    <EmployeePhotoCard
                        photoUrl={p.photo.photoUrl}
                        uploading={p.photo.uploading}
                        isEditMode={p.isEditMode}
                        fullName={form.fullName}
                        onFileSelected={p.photo.handleFileSelected}
                    />
                </div>
            </form>
        </div>
    );
}
