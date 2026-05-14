import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface TransferBoardHeaderProps {
    total: number;
}

export function TransferBoardHeader({ total }: TransferBoardHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
            <div>
                <h1 className="text-2xl font-bold text-text-1 tracking-tight">
                    Stock Transfers
                </h1>
                <p className="text-sm text-text-3 mt-1">
                    {total} transfer{total === 1 ? '' : 's'} across the
                    pipeline. Drag-free Kanban — click a card to review,
                    approve, ship, or receive.
                </p>
            </div>
            <Link
                to={FRONTEND_ROUTES.ADMIN_TRANSFER_NEW}
                className="h-9 px-4 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all flex items-center gap-2 self-start focus:outline-none focus:ring-[3px] focus:ring-primary/30"
            >
                <Plus size={14} strokeWidth={2.5} />
                Create transfer
            </Link>
        </div>
    );
}
