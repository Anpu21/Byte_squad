import type { DiscountType, PadMode } from '../types/pad-mode.type';

interface PosNumpadProps {
    padMode: PadMode;
    padValue: string;
    customName: string;
    onCustomNameChange: (value: string) => void;
    onToggleMode: (mode: PadMode) => void;
    onPadPress: (key: string) => void;
    onPadConfirm: () => void;
    discountType: DiscountType;
    onToggleDiscountType: () => void;
}

const MODE_BUTTONS = [
    { mode: 'qty' as PadMode, label: 'Qty', title: 'Set quantity before adding product' },
    { mode: 'disc' as PadMode, label: 'Discount', title: 'Apply discount to bill' },
    { mode: 'custom' as PadMode, label: 'Custom item', title: 'Add custom item' },
];

const MODE_LABEL: Record<PadMode, string> = {
    idle: '',
    qty: 'Enter Quantity',
    price: 'Enter Price',
    disc: '',
    custom: 'Custom Item Price',
};

const NUMERIC_KEYS = ['7', '8', '9', 'C', '4', '5', '6', '.', '1', '2', '3', ''] as const;

export function PosNumpad({
    padMode,
    padValue,
    customName,
    onCustomNameChange,
    onToggleMode,
    onPadPress,
    onPadConfirm,
    discountType,
    onToggleDiscountType,
}: PosNumpadProps) {
    const headerLabel =
        padMode === 'disc'
            ? `Discount (${discountType === 'percentage' ? '%' : 'LKR'})`
            : MODE_LABEL[padMode];

    return (
        <div className="border-t border-border">
            <div className="grid grid-cols-3 gap-1 p-2">
                {MODE_BUTTONS.map((btn) => {
                    const active = padMode === btn.mode;
                    return (
                        <button
                            key={btn.mode}
                            type="button"
                            onClick={() => onToggleMode(btn.mode)}
                            title={btn.title}
                            aria-pressed={active}
                            className={`h-8 rounded-md text-[11px] font-semibold tracking-wide transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20 ${
                                active
                                    ? 'bg-primary text-text-inv'
                                    : 'bg-surface-2 border border-border text-text-2 hover:text-text-1 hover:bg-primary-soft'
                            }`}
                        >
                            {btn.label}
                        </button>
                    );
                })}
            </div>

            {padMode !== 'idle' && (
                <div className="px-2 pb-2">
                    <div className="flex items-center justify-between h-6 mb-1.5 px-1">
                        <p className="text-[10px] font-semibold text-text-3 uppercase tracking-wider">
                            {headerLabel}
                        </p>
                        {padMode === 'disc' ? (
                            <button
                                type="button"
                                onClick={onToggleDiscountType}
                                className="text-[10px] font-semibold text-text-2 hover:text-text-1 px-2 py-0.5 rounded bg-surface-2 border border-border transition-colors focus:outline-none focus:ring-[2px] focus:ring-primary/20"
                            >
                                Switch to {discountType === 'fixed' ? '%' : 'LKR'}
                            </button>
                        ) : (
                            <span aria-hidden="true" className="invisible text-[10px] px-2 py-0.5">placeholder</span>
                        )}
                    </div>

                    {padMode === 'custom' && (
                        <input
                            value={customName}
                            onChange={(e) => onCustomNameChange(e.target.value)}
                            placeholder="Item name…"
                            aria-label="Custom item name"
                            className="w-full h-9 px-3 mb-1.5 bg-canvas border border-border rounded-md text-[13px] text-text-1 outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/30 placeholder:text-text-3 transition-colors"
                        />
                    )}

                    <div className="h-10 px-3 bg-canvas border border-border rounded-md flex items-center justify-end mb-1.5">
                        <span className="text-lg font-bold text-text-1 tabular-nums tracking-tight mono">
                            {padMode === 'disc' && discountType === 'percentage' && padValue
                                ? `${padValue}%`
                                : padValue || '0'}
                        </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1">
                        {NUMERIC_KEYS.map((key, i) =>
                            key ? (
                                <button
                                    key={key + i}
                                    type="button"
                                    onClick={() => onPadPress(key)}
                                    aria-label={key === 'C' ? 'Clear' : `Digit ${key}`}
                                    className={`h-9 rounded-md text-sm font-bold transition-colors focus:outline-none focus:ring-[3px] focus:ring-primary/20 ${
                                        key === 'C'
                                            ? 'bg-danger-soft text-danger hover:bg-danger-soft border border-danger/30'
                                            : 'bg-surface-2 border border-border text-text-1 hover:bg-primary-soft'
                                    }`}
                                >
                                    {key}
                                </button>
                            ) : (
                                <div key={i} />
                            ),
                        )}
                        <button
                            type="button"
                            onClick={() => onPadPress('0')}
                            aria-label="Digit 0"
                            className="h-9 rounded-md text-sm font-bold bg-surface-2 border border-border text-text-1 hover:bg-primary-soft transition-colors col-span-2 focus:outline-none focus:ring-[3px] focus:ring-primary/20"
                        >
                            0
                        </button>
                        <button
                            type="button"
                            onClick={onPadConfirm}
                            className="h-9 rounded-md text-sm font-bold bg-primary text-text-inv hover:bg-primary-hover transition-colors col-span-2 focus:outline-none focus:ring-[3px] focus:ring-primary/30"
                        >
                            {padMode === 'qty'
                                ? 'Set qty'
                                : padMode === 'disc'
                                  ? 'Apply'
                                  : 'Add'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
