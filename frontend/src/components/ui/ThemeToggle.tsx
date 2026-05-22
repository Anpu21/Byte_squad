import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
    className?: string;
    size?: number;
}

export default function ThemeToggle({ className, size = 16 }: ThemeToggleProps) {
    const { theme, toggle } = useTheme();
    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className={cn(
                'p-2 text-text-2 hover:text-text-1 hover:bg-surface-2 rounded-md transition-colors',
                className,
            )}
        >
            {theme === 'dark' ? <Sun size={size} /> : <Moon size={size} />}
        </button>
    );
}
