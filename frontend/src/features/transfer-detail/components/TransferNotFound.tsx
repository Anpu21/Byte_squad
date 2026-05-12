import { useNavigate } from 'react-router-dom';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface TransferNotFoundProps {
    error: string | null;
}

export function TransferNotFound({ error }: TransferNotFoundProps) {
    const navigate = useNavigate();
    return (
        <div className="animate-in fade-in duration-300">
            <p className="text-sm text-text-2">
                {error ?? 'Transfer not found'}
            </p>
            <button
                type="button"
                onClick={() => navigate(FRONTEND_ROUTES.TRANSFERS)}
                className="mt-4 h-9 px-4 rounded-lg border border-border text-sm text-text-1 hover:bg-surface-2 transition-colors"
            >
                Back to transfers
            </button>
        </div>
    );
}
