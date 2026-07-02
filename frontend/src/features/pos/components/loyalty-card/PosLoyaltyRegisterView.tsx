import { LuArrowLeft as ArrowLeft } from 'react-icons/lu';
import { PosLoyaltyEnrollForm } from './PosLoyaltyEnrollForm';

export interface IPosLoyaltyRegisterViewProps {
    onBack: () => void;
    onSubmit: (firstName: string, lastName: string | undefined) => void;
    isSubmitting: boolean;
    phoneValid: boolean;
    error: string | null;
}

/**
 * Register-mode body of the loyalty card: a "back to search" link + the
 * walk-in name-capture enrol form. The card owns the (editable) phone field
 * rendered above this, so enrolment is gated on `phoneValid`.
 */
export function PosLoyaltyRegisterView({
    onBack,
    onSubmit,
    isSubmitting,
    phoneValid,
    error,
}: IPosLoyaltyRegisterViewProps) {
    return (
        <div className="flex flex-col gap-3">
            <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1 self-start text-[11px] font-medium text-text-3 hover:text-text-1 transition-colors focus:outline-none focus-visible:ring-[2px] focus-visible:ring-focus/30 rounded-sm"
            >
                <ArrowLeft size={12} aria-hidden />
                Back to search
            </button>
            <PosLoyaltyEnrollForm
                onSubmit={onSubmit}
                isSubmitting={isSubmitting}
                phoneValid={phoneValid}
                error={error}
            />
        </div>
    );
}
