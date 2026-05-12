import type { ReactNode } from 'react';

interface StatementSectionProps {
    title: string;
    children: ReactNode;
}

export function StatementSection({ title, children }: StatementSectionProps) {
    return (
        <div className="py-1">
            <div className="px-5 py-2.5">
                <h3 className="text-[11px] uppercase tracking-[0.08em] text-text-3 font-semibold">
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );
}
