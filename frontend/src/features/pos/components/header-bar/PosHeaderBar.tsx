import { useNavigate } from 'react-router-dom';
import {
    LuLayers as Layers,
    LuCirclePause as PauseCircle,
    LuUndo2 as Undo2,
    LuNotebookTabs as NotebookTabs,
} from 'react-icons/lu';
import Button from '@/components/ui/Button';
import { FRONTEND_ROUTES } from '@/constants/routes';
import { PosShiftControls } from '../shift/PosShiftControls';
import { PosModeSwitch, type PosMode } from '../mode-switch/PosModeSwitch';

interface PosHeaderBarProps {
    mode: PosMode;
    onModeChange: (mode: PosMode) => void;
    cartEmpty: boolean;
    heldCount: number;
    onHoldBill: () => void;
    onShowHeld: () => void;
    onShowReturn: () => void;
}

/** Mode switch + billing-only quick actions (hold / held / return / credit). */
export function PosHeaderBar({
    mode,
    onModeChange,
    cartEmpty,
    heldCount,
    onHoldBill,
    onShowHeld,
    onShowReturn,
}: PosHeaderBarProps) {
    const navigate = useNavigate();
    return (
        <div className="flex items-center justify-between gap-2">
            <PosModeSwitch mode={mode} onChange={onModeChange} />
            {mode === 'billing' && (
                <div className="flex items-center gap-1.5">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onHoldBill}
                        disabled={cartEmpty}
                    >
                        <PauseCircle size={14} aria-hidden />
                        Hold bill
                    </Button>
                    <Button size="sm" variant="secondary" onClick={onShowHeld}>
                        <Layers size={14} aria-hidden />
                        Held ({heldCount})
                    </Button>
                    <Button size="sm" variant="secondary" onClick={onShowReturn}>
                        <Undo2 size={14} aria-hidden />
                        Return
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(FRONTEND_ROUTES.STORE_CREDIT)}
                        title="Look up a store-credit customer or take a repayment"
                    >
                        <NotebookTabs size={14} aria-hidden />
                        Store credit
                    </Button>
                    <PosShiftControls />
                </div>
            )}
        </div>
    );
}
