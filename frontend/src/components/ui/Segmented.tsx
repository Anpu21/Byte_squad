import { cn } from '@/lib/utils';

interface SegmentedOption<T extends string> {
    label: string;
    value: T;
}

interface SegmentedProps<T extends string> {
    value: T;
    options: SegmentedOption<T>[];
    onChange: (value: T) => void;
    className?: string;
    size?: 'sm' | 'md';
}

export default function Segmented<T extends string>({
    value,
    options,
    onChange,
    className,
    size = 'md',
}: SegmentedProps<T>) {
    const padding = size === 'sm' ? 'px-2.5 py-1' : 'px-3 py-1.5';
    return (
        <div
            className={cn(
                'inline-flex p-[3px] gap-[2px] bg-surface-2 rounded-lg',
                className,
            )}
        >
            {options.map((opt) => {
                const on = opt.value === value;
                return (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChange(opt.value)}
                        className={cn(
                            'rounded-md text-xs font-medium transition-colors duration-150 cursor-pointer',
                            padding,
                            on
                                ? 'bg-surface text-text-1 shadow-xs'
                                : 'text-text-2 hover:text-text-1',
                        )}
                    >
                        {opt.label}
                    </button>
                );
            })}
        </div>
    );
}
