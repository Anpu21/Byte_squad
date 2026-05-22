import { Minus, Plus } from 'lucide-react';

interface QtyStepperProps {
    qty: number;
    onIncrement: () => void;
    onDecrement: () => void;
}

export function QtyStepper({ qty, onIncrement, onDecrement }: QtyStepperProps) {
    return (
        <div className="flex items-center gap-2 bg-surface border border-border rounded-lg p-1">
            <button
                type="button"
                onClick={onDecrement}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-2"
            >
                <Minus size={14} />
            </button>
            <span className="font-semibold text-text-1 min-w-[2ch] text-center">
                {qty}
            </span>
            <button
                type="button"
                onClick={onIncrement}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-2"
            >
                <Plus size={14} />
            </button>
        </div>
    );
}
