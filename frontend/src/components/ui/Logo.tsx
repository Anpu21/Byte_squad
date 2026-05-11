import { cn } from '@/lib/utils';

interface LogoProps {
    size?: number;
    label?: boolean;
    className?: string;
    text?: string;
}

export default function Logo({
    size = 28,
    label = true,
    text = 'Ledger Pro',
    className,
}: LogoProps) {
    return (
        <div className={cn('inline-flex items-center gap-2', className)}>
            <div
                className="inline-flex items-center justify-center rounded-md bg-primary text-text-inv font-bold mono"
                style={{ width: size, height: size, fontSize: Math.round(size * 0.5) }}
                aria-hidden="true"
            >
                L
            </div>
            {label && (
                <span
                    className="font-semibold tracking-[-0.01em] text-text-1"
                    style={{ fontSize: 15 }}
                >
                    {text}
                </span>
            )}
        </div>
    );
}
