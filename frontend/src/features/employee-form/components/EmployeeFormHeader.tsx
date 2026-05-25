import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';
import Button from '@/components/ui/Button';

interface EmployeeFormHeaderProps {
    isEditMode: boolean;
    isSubmitting: boolean;
}

export function EmployeeFormHeader({
    isEditMode,
    isSubmitting,
}: EmployeeFormHeaderProps) {
    const navigate = useNavigate();
    return (
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
            <div className="min-w-0">
                <button
                    type="button"
                    onClick={() => navigate(FRONTEND_ROUTES.ADMIN_EMPLOYEES)}
                    className="inline-flex items-center gap-1.5 text-xs text-text-2 hover:text-text-1 transition-colors mb-2"
                >
                    <ArrowLeft size={12} /> Back to employees
                </button>
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    {isEditMode ? 'Edit employee' : 'Add new employee'}
                </h1>
                <p className="text-xs text-text-2 mt-1">
                    {isEditMode
                        ? 'Update the HR profile for this employee.'
                        : 'Capture identity, contact, employment, and payroll details.'}
                </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => navigate(FRONTEND_ROUTES.ADMIN_EMPLOYEES)}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    form="employee-form"
                    size="md"
                    disabled={isSubmitting}
                >
                    <Save size={14} />
                    {isSubmitting
                        ? 'Saving…'
                        : isEditMode
                          ? 'Save changes'
                          : 'Create employee'}
                </Button>
            </div>
        </div>
    );
}
