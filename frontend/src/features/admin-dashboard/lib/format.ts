export function formatRevenue(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Compact money for donut centres and chart axes: 1_815_377 → "1.82M",
 * 235_225 → "235K". No currency symbol — callers pair it with a "Total" caption
 * or an axis. Negatives are preserved.
 */
export function formatCompact(amount: number): string {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(2).replace(/\.?0+$/, '')}M`;
    }
    if (abs >= 1_000) {
        return `${Math.round(amount / 1_000)}K`;
    }
    return String(Math.round(amount));
}

export function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function formatDayShort(date: string): string {
    const d = new Date(date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getGreeting(now: Date = new Date()): string {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

export function getTodayLabel(now: Date = new Date()): string {
    return now.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}
