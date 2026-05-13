import { type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Camera, QrCode, Search, X } from 'lucide-react';
import { FRONTEND_ROUTES } from '@/constants/routes';

interface PosSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    onOpenCamera: () => void;
    inputRef: RefObject<HTMLInputElement | null>;
}

export function PosSearchBar({
    value,
    onChange,
    onClear,
    onOpenCamera,
    inputRef,
}: PosSearchBarProps) {
    return (
        <div className="flex gap-3">
            <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-2">
                    <Search size={22} />
                </div>
                <input
                    ref={inputRef}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-14 pl-12 pr-24 bg-surface border border-border rounded-md text-lg text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 transition-all placeholder:text-text-3 shadow-xl"
                    placeholder="Scan barcode or search product..."
                    autoFocus
                    aria-label="Search product or scan barcode"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {value && (
                        <button
                            type="button"
                            onClick={onClear}
                            aria-label="Clear search"
                            className="p-1 text-text-3 hover:text-text-1 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    )}
                    <kbd className="hidden sm:inline-flex items-center justify-center h-7 px-2.5 rounded border border-border-strong bg-surface-2 text-[11px] font-bold text-text-2">
                        F2
                    </kbd>
                </div>
            </div>
            <button
                type="button"
                onClick={onOpenCamera}
                className="h-14 w-14 flex-shrink-0 bg-surface border border-border rounded-md flex items-center justify-center text-text-2 hover:text-text-1 hover:border-border-strong hover:bg-surface-2 transition-all shadow-xl"
                title="Scan with camera"
                aria-label="Open camera scanner"
            >
                <Camera size={24} strokeWidth={1.5} />
            </button>
            <Link
                to={FRONTEND_ROUTES.SCAN_ORDER}
                className="h-14 px-4 flex-shrink-0 bg-surface border border-border rounded-md flex items-center gap-2 text-text-1 hover:text-text-1 hover:border-border-strong hover:bg-surface-2 transition-all shadow-xl text-sm font-semibold"
                title="Scan a customer pickup QR"
            >
                <QrCode size={20} />
                Pickup
            </Link>
        </div>
    );
}
