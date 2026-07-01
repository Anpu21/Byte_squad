import { useNavigate } from 'react-router-dom';
import { LuPlus as Plus } from 'react-icons/lu';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { EmployeesTable } from './EmployeesTable';

interface EmployeesViewProps {
    showHeader?: boolean;
}

export function EmployeesView({ showHeader = true }: EmployeesViewProps) {
    const navigate = useNavigate();
    return (
        <>
            {showHeader && (
                <PageHeader
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
            )}
            <EmployeesTable />
        </>
    );
}
