export function formatRevenue(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        maximumFractionDigits: 0,
    }).format(amount);
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
