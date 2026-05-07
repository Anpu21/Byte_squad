import { useEffect, useRef, useState } from 'react';
import type { ExportFormat } from '@/lib/exportUtils';

interface ExportMenuProps {
    onExport: (format: ExportFormat) => void | Promise<void>;
    disabled?: boolean;
    isPreparing?: boolean;
}

export default function ExportMenu({
    onExport,
    disabled = false,
    isPreparing = false,
}: ExportMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    const handleSelect = async (format: ExportFormat) => {
        setOpen(false);
        await onExport(format);
    };

    const isDisabled = disabled || isPreparing;

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={isDisabled}
                className="h-9 px-4 rounded-lg bg-transparent border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                </svg>
                {isPreparing ? 'Preparing…' : 'Export'}
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform duration-200 ${
                        open ? 'rotate-180' : ''
                    }`}
                >
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                        type="button"
                        onClick={() => handleSelect('pdf')}
                        className="flex items-start gap-3 px-4 py-3 w-full text-left hover:bg-surface-2 transition-colors border-b border-border"
                    >
                        <div className="w-8 h-8 rounded-lg bg-danger-soft flex items-center justify-center flex-shrink-0">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#f43f5e"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-text-1">
                                Download PDF
                            </p>
                            <p className="text-[11px] text-text-3 mt-0.5">
                                Printable report
                            </p>
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSelect('excel')}
                        className="flex items-start gap-3 px-4 py-3 w-full text-left hover:bg-surface-2 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <line x1="9" y1="3" x2="9" y2="21" />
                                <line x1="15" y1="3" x2="15" y2="21" />
                                <line x1="3" y1="9" x2="21" y2="9" />
                                <line x1="3" y1="15" x2="21" y2="15" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-medium text-text-1">
                                Download Excel
                            </p>
                            <p className="text-[11px] text-text-3 mt-0.5">
                                Sortable spreadsheet
                            </p>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
}
