const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatTimeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < MINUTE) return 'just now';
    if (diff < HOUR) {
        const m = Math.floor(diff / MINUTE);
        return `${m}m ago`;
    }
    if (diff < DAY) {
        const h = Math.floor(diff / HOUR);
        return `${h}h ago`;
    }
    const d = Math.floor(diff / DAY);
    if (d < 30) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
}
