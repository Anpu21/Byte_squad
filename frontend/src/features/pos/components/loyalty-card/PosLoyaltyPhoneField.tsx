import type { ChangeEvent } from 'react';
import { LuLoaderCircle as Loader2, LuPhone as Phone } from 'react-icons/lu';
import Input from '@/components/ui/Input';

export interface IPosLoyaltyPhoneFieldProps {
    phoneRaw: string;
    onPhoneChange: (next: string) => void;
    /** Spinner shows while the debounced lookup is in flight. */
    isSearching: boolean;
}

/**
 * Phone input used while no loyalty owner is attached. Uses
 * `type="tel"` + `inputMode="tel"` so mobile + tablet keyboards
 * surface the numeric keypad, and accepts `+`, spaces, parens, and
 * dashes via the visible `pattern` for paste-friendly card numbers.
 * The actual lookup hook normalises the value before it leaves the
 * page so the BE regex stays happy.
 */
export function PosLoyaltyPhoneField({
    phoneRaw,
    onPhoneChange,
    isSearching,
}: IPosLoyaltyPhoneFieldProps) {
    return (
        <Input
            type="tel"
            inputMode="tel"
            label="Customer phone"
            value={phoneRaw}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                onPhoneChange(e.target.value)
            }
            placeholder="e.g. +94 77 123 4567"
            pattern="[0-9 +()-]*"
            autoComplete="off"
            leftIcon={<Phone size={16} aria-hidden />}
            rightSlot={
                isSearching ? (
                    <Loader2
                        size={16}
                        aria-hidden
                        className="animate-spin text-text-3"
                    />
                ) : null
            }
            aria-label="Loyalty member phone"
            aria-busy={isSearching}
        />
    );
}
