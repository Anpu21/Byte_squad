import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { EmployeesTable } from '@/features/admin-employees/components/EmployeesTable';

export function AdminEmployeesPage() {
    const navigate = useNavigate();
    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <PageHeader
                eyebrow="People"
                title="Employees"
                subtitle="Manage the HR roster — identity, employment terms, payroll details, and lifecycle status."
                actions={
                    <Button
                        type="button"
                        size="md"
                        onClick={() =>
                            navigate(FRONTEND_ROUTES.ADMIN_EMPLOYEE_NEW)
                        }
                    >
                        <Plus size={14} />
                        New employee
                    </Button>
                }
            />

            <EmployeesTable />
        </div>
    );
}
