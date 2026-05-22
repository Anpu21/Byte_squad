interface LoyaltyKpisProps {
    lifetimeEarned: number;
    lifetimeRedeemed: number;
}

interface KpiProps {
    label: string;
    value: number;
}

function Kpi({ label, value }: KpiProps) {
    return (
        <div className="bg-surface border border-border rounded-md p-4">
            <p className="text-[11px] uppercase tracking-widest text-text-3">
                {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-text-1">{value}</p>
        </div>
    );
}

export function LoyaltyKpis({ lifetimeEarned, lifetimeRedeemed }: LoyaltyKpisProps) {
    const net = lifetimeEarned - lifetimeRedeemed;
    return (
        <section className="grid grid-cols-3 gap-3 mb-6">
            <Kpi label="Earned (lifetime)" value={lifetimeEarned} />
            <Kpi label="Redeemed" value={lifetimeRedeemed} />
            <Kpi label="Net" value={net} />
        </section>
    );
}
