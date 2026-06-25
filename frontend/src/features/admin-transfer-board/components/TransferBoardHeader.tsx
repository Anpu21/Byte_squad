import { Link } from 'react-router-dom';
import { LuPlus as Plus } from 'react-icons/lu';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface TransferBoardHeaderProps {
    total: number;
}

/**
 * Board-tab toolbar for the admin transfers workspace — the live pipeline count
 * and the "create transfer" action. The page title now lives in the
 * `WorkspacePage` header, so this is a caption row (not an `<h1>`); it stays
 * rendered when embedded under Inventory so the create action is always reachable.
 */
export function TransferBoardHeader({ total }: TransferBoardHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <p className="text-sm text-text-3">
                {total} transfer{total === 1 ? '' : 's'} across the pipeline —
                filter by stage and act inline, or open one for full details.
            </p>
            <Link
                to={FRONTEND_ROUTES.ADMIN_TRANSFER_NEW}
                className="h-9 px-4 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all flex items-center gap-2 self-start sm:self-auto focus:outline-none focus:ring-[3px] focus:ring-primary/30"
            >
                <Plus size={14} strokeWidth={2.5} />
                Create transfer
            </Link>
        </div>
    );
}
