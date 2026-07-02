import { useEffect, useState } from 'react';
import { LuAward as Award, LuX as X } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import { usePosLoyaltyLookup } from '@/features/pos/hooks/usePosLoyaltyLookup';
import { usePosLoyaltyEnroll } from '@/features/pos/hooks/usePosLoyaltyEnroll';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';
import type { ILoyaltyLookupResult } from '@/types';
import { PosLoyaltyEnrollForm } from './PosLoyaltyEnrollForm';
import { PosLoyaltyHitBody } from './PosLoyaltyHitBody';
import { PosLoyaltyPhoneField } from './PosLoyaltyPhoneField';
import {
    extractEnrollError,
    sanitisePhone,
} from './pos-loyalty-card.helpers';
import {
    isValidSriLankaPhone,
    normalizeSriLankaPhone,
    SRI_LANKA_PHONE_ERROR,
} from '@/lib/phone';

const DEBOUNCE_MS = 350;

export interface IPosLoyaltyCardProps {
    loyaltyOwner: IPosLoyaltyOwner | null;
    onAttach: (owner: IPosLoyaltyOwner) => void;
    onDetach: () => void;
    redeemPoints: number;
    onRedeemChange: (next: number) => void;
    /** Server-mirrored redeem cap for this bill; clamps the redeem input. */
    maxRedeemable?: number;
    /** Why redemption is unavailable when the cap is 0 (shown on the card). */
    redeemDisabledReason?: string | null;
}

/**
 * Cashier-side loyalty attach card. State machine driven by the phone
 * input + lookup query: idle (empty / too few digits) → searching
 * (debounced lookup in flight) → hit (wallet displayed + redeem
 * input) → miss (inline enrol form). Backend enforces the precise
 * redeem cap (50% subtotal by default) — the FE only clamps to the
 * wallet balance and lets the create-sale mutation surface a clear
 * BadRequestException toast on over-cap attempts.
 */
export function PosLoyaltyCard({
    loyaltyOwner,
    onAttach,
    onDetach,
    redeemPoints,
    onRedeemChange,
    maxRedeemable,
    redeemDisabledReason,
}: IPosLoyaltyCardProps) {
    const [phoneRaw, setPhoneRaw] = useState('');
    const debouncedPhone = useDebouncedSanitisedPhone(phoneRaw);

    const lookup = usePosLoyaltyLookup(debouncedPhone);
    const enroll = usePosLoyaltyEnroll({ phone: debouncedPhone });

    // Promote a successful lookup into the page-level owner state so
    // the create-sale payload reads the same shape the cashier sees.
    useEffect(() => {
        if (loyaltyOwner) return;
        if (lookup.data) onAttach(toOwner(lookup.data));
    }, [lookup.data, loyaltyOwner, onAttach]);

    const handleClear = () => {
        onDetach();
        onRedeemChange(0);
        setPhoneRaw('');
    };

    const handleEnrol = (firstName: string, lastName: string | undefined) => {
        enroll.mutate(
            { firstName, lastName },
            { onSuccess: (result) => onAttach(toOwner(result)) },
        );
    };

    const isSearching =
        lookup.isFetching && lookup.fetchStatus !== 'idle' && !lookup.data;
    const showMiss =
        !loyaltyOwner &&
        debouncedPhone.length > 0 &&
        lookup.data === null &&
        !lookup.isFetching;
    // Typed something that isn't a valid SL number yet — nudge, don't error.
    const showInvalid =
        !loyaltyOwner &&
        debouncedPhone.length > 0 &&
        !isValidSriLankaPhone(debouncedPhone) &&
        !isSearching;
    const enrolPhone =
        normalizeSriLankaPhone(debouncedPhone) ?? debouncedPhone;

    return (
        <section
            aria-label="Loyalty"
            className="bg-surface border border-border-strong rounded-lg p-4 flex flex-col gap-3"
        >
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Award size={16} aria-hidden className="text-primary" />
                    <h2 className="text-[12px] font-semibold uppercase tracking-wide text-text-2">
                        Loyalty
                        <span className="ml-1.5 normal-case font-normal text-text-3">
                            (optional)
                        </span>
                    </h2>
                </div>
                {loyaltyOwner ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        aria-label="Detach loyalty member"
                    >
                        <X size={14} aria-hidden />
                        Clear
                    </Button>
                ) : null}
            </header>

            {loyaltyOwner ? (
                <PosLoyaltyHitBody
                    owner={loyaltyOwner}
                    redeemPoints={redeemPoints}
                    onRedeemChange={onRedeemChange}
                    maxRedeemable={maxRedeemable}
                    redeemDisabledReason={redeemDisabledReason}
                />
            ) : (
                <PosLoyaltyPhoneField
                    phoneRaw={phoneRaw}
                    onPhoneChange={setPhoneRaw}
                    isSearching={isSearching}
                />
            )}

            {showInvalid ? (
                <p className="text-[11px] text-text-3">
                    {SRI_LANKA_PHONE_ERROR}
                </p>
            ) : null}

            {!loyaltyOwner && lookup.isError ? (
                <p role="alert" className="text-[11px] text-danger">
                    Could not check loyalty membership. Try again.
                </p>
            ) : null}

            {showMiss ? (
                <PosLoyaltyEnrollForm
                    phone={enrolPhone}
                    onSubmit={handleEnrol}
                    isSubmitting={enroll.isPending}
                    error={extractEnrollError(enroll.error)}
                />
            ) : null}
        </section>
    );
}

/**
 * Map the wire-shape `ILoyaltyLookupResult` onto the trimmed
 * `IPosLoyaltyOwner` slot the page persists. Centralised here so the
 * lookup and enrol paths produce identical owner objects.
 */
function toOwner(result: ILoyaltyLookupResult): IPosLoyaltyOwner {
    return {
        ownerType: result.ownerType,
        userId: result.userId,
        loyaltyCustomerId: result.loyaltyCustomerId,
        tier: result.tier,
        firstName: result.firstName,
        pointsBalance: result.pointsBalance,
    };
}

/**
 * Debounces the cashier-typed phone string and strips display
 * formatting before handing it to the lookup query. Inline (rather
 * than reused from a shared hook) so the card has a single
 * controlled debounce ms — see `PosItemSearchInput` for the parallel
 * pattern in the search input.
 */
function useDebouncedSanitisedPhone(raw: string): string {
    const [debounced, setDebounced] = useState('');
    useEffect(() => {
        const handle = window.setTimeout(() => {
            setDebounced(sanitisePhone(raw));
        }, DEBOUNCE_MS);
        return () => window.clearTimeout(handle);
    }, [raw]);
    return debounced;
}
