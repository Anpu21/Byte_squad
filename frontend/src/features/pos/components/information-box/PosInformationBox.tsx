import { useQuery } from '@tanstack/react-query';
import { Calendar, Hash, MapPin, UserRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profile.service';
import { queryKeys } from '@/lib/queryKeys';
import { usePosInvoiceNumber } from '@/features/pos/hooks/usePosInvoiceNumber';

/**
 * Cashier-session context strip. Pure display: pulls the signed-in user
 * via `useAuth`, the user's branch via the profile query (auth state only
 * carries branchId, not the populated relation), today's date, and the
 * server-previewed next invoice number.
 *
 * Wholly side-effect-free aside from the two queries it owns; safe to
 * mount anywhere in the cashier workspace.
 */
export function PosInformationBox() {
    const { user } = useAuth();
    const profileQuery = useQuery({
        queryKey: queryKeys.profile.self(),
        queryFn: profileService.getProfile,
        enabled: Boolean(user?.id),
        staleTime: 60_000,
    });
    const invoiceNumberQuery = usePosInvoiceNumber();

    const cashierName = user
        ? `${user.firstName} ${user.lastName}`.trim()
        : '—';
    const branchName = profileQuery.data?.branch?.name ?? '—';
    const today = new Date().toLocaleDateString('en-LK', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        weekday: 'short',
    });
    const previewInvoiceNumber =
        invoiceNumberQuery.data?.invoiceNo ?? 'INV-…';

    return (
        <section
            aria-label="Cashier session"
            className="bg-surface border border-border-strong rounded-lg p-4 grid grid-cols-2 gap-x-4 gap-y-3"
        >
            <Field
                icon={<UserRound size={14} aria-hidden />}
                label="Cashier"
                value={cashierName}
            />
            <Field
                icon={<MapPin size={14} aria-hidden />}
                label="Branch"
                value={branchName}
            />
            <Field
                icon={<Calendar size={14} aria-hidden />}
                label="Today"
                value={today}
            />
            <Field
                icon={<Hash size={14} aria-hidden />}
                label="Next invoice"
                value={previewInvoiceNumber}
                mono
            />
        </section>
    );
}

interface IFieldProps {
    icon: React.ReactNode;
    label: string;
    value: string;
    mono?: boolean;
}

function Field({ icon, label, value, mono }: IFieldProps) {
    return (
        <div className="flex items-start gap-2">
            <span className="flex items-center justify-center w-7 h-7 rounded-md bg-surface-2 text-text-2 shrink-0">
                {icon}
            </span>
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] uppercase tracking-wide text-text-3">
                    {label}
                </span>
                <span
                    className={`text-[13px] font-semibold text-text-1 truncate ${
                        mono ? 'font-mono' : ''
                    }`}
                >
                    {value}
                </span>
            </div>
        </div>
    );
}
