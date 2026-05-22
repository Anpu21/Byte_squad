import { cn } from '@/lib/utils';

interface AvatarProps {
    name?: string;
    size?: number;
    src?: string;
    className?: string;
}

function initials(name?: string) {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';
    return (first + second).toUpperCase();
}

export default function Avatar({ name, size = 32, src, className }: AvatarProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center justify-center rounded-full bg-primary-soft text-primary-soft-text font-semibold flex-shrink-0 overflow-hidden',
                className,
            )}
            style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
        >
            {src ? (
                <img
                    src={src}
                    alt={name ?? ''}
                    className="w-full h-full object-cover"
                />
            ) : (
                initials(name)
            )}
        </div>
    );
}
