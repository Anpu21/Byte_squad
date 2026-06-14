import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
    BarChart3,
    CalendarClock,
    FileClock,
    HandCoins,
    PackagePlus,
    PiggyBank,
    Scale,
    ScrollText,
    Wallet,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/constants/enums';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface IReportLink {
    title: string;
    description: string;
    to: string;
    icon: ReactNode;
    roles: UserRole[];
}

const LINKS: IReportLink[] = [
    {
        title: 'Salesman report',
        description: 'Cashier-wise sales performance and totals.',
        to: `${FRONTEND_ROUTES.SALES}?tab=salesman`,
        icon: <BarChart3 size={16} />,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
        title: 'Financial reports',
        description: 'Trial balance, balance sheet, day book, period locks.',
        to: FRONTEND_ROUTES.FINANCIAL_REPORTS,
        icon: <Scale size={16} />,
        roles: [UserRole.ADMIN],
    },
    {
        title: 'Profit & Loss',
        description: 'Income vs expenses by branch and date range.',
        to: FRONTEND_ROUTES.PROFIT_LOSS,
        icon: <PiggyBank size={16} />,
        roles: [UserRole.ADMIN],
    },
    {
        title: 'General ledger',
        description: 'Every posting with running filters and summaries.',
        to: FRONTEND_ROUTES.LEDGER,
        icon: <ScrollText size={16} />,
        roles: [UserRole.ADMIN],
    },
    {
        title: 'Receivables',
        description: 'Customer credit, ageing buckets, statements.',
        to: FRONTEND_ROUTES.RECEIVABLES,
        icon: <HandCoins size={16} />,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
        title: 'Purchases & payables',
        description: 'Supplier bills, outstanding, payables ageing.',
        to: FRONTEND_ROUTES.PURCHASES,
        icon: <PackagePlus size={16} />,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
        title: 'Expiry report',
        description: 'Batches nearing or past their expiry dates.',
        to: `${FRONTEND_ROUTES.INVENTORY}?tab=expiry`,
        icon: <CalendarClock size={16} />,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
        title: 'Expenses',
        description: 'Branch expenses with the approval trail.',
        to: FRONTEND_ROUTES.EXPENSES,
        icon: <Wallet size={16} />,
        roles: [UserRole.ADMIN, UserRole.MANAGER],
    },
    {
        title: 'Audit log',
        description: 'Every change made through the API — who and when.',
        to: FRONTEND_ROUTES.ADMIN_AUDIT,
        icon: <FileClock size={16} />,
        roles: [UserRole.ADMIN],
    },
];

/** Role-aware launcher grid for every report surface in the app. */
export function ReportLinksGrid() {
    const { user } = useAuth();
    const visible = LINKS.filter(
        (link) => user && link.roles.includes(user.role),
    );

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {visible.map((link) => (
                <Link
                    key={link.title}
                    to={link.to}
                    className="group focus:outline-none focus:ring-[3px] focus:ring-primary/30 rounded-xl"
                >
                    <Card className="h-full p-4 transition-colors group-hover:border-primary/40">
                        <div className="flex items-center gap-2 text-primary">
                            {link.icon}
                            <span className="text-[13px] font-semibold text-text-1">
                                {link.title}
                            </span>
                        </div>
                        <p className="mt-1.5 text-[12px] leading-relaxed text-text-3">
                            {link.description}
                        </p>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
