import { LuMinus as Minus, LuPlus as Plus } from 'react-icons/lu';

interface QtyStepperProps {
    qty: number;
    onIncrement: () => void;
    onDecrement: () => void;
}

export function QtyStepper({ qty, onIncrement, onDecrement }: QtyStepperProps) {
    return (
        <div className="flex items-center gap-2 bg-surface border border-border rounded-xl shadow-sm-token p-1">
            <button
                type="button"
                onClick={onDecrement}
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-surface-2 transition-colors"
            >
                <Minus size={14} />
            </button>
            <span className="font-semibold text-text-1 tabular-nums min-w-[2ch] text-center">
                {qty}
            </span>
            <button
                type="button"
                onClick={onIncrement}
                className="w-9 h-9 flex items-center justify-center rounded-md hover:bg-surface-2 transition-colors"
            >
                <Plus size={14} />
            </button>
        </div>
    );
}
