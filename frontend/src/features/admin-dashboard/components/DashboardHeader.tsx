import { Download } from 'lucide-react';
import Button from '@/components/ui/Button';

interface DashboardHeaderProps {
    todayLabel: string;
    greeting: string;
    firstName: string | undefined;
}

export function DashboardHeader({
    todayLabel,
    greeting,
    firstName,
}: DashboardHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4 mb-6">
            <div className="min-w-0">
                <p className="text-xs text-text-2">{todayLabel}</p>
                <h1 className="text-[32px] font-bold tracking-[-0.02em] text-text-1 mt-0.5">
                    {greeting}, {firstName ?? 'there'}
                </h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <Button variant="secondary" size="md">
                    <Download size={14} /> Export
                </Button>
            </div>
        </div>
    );
}
