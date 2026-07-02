import { useEffect, useState } from 'react';
import {
    LuAward as Award,
    LuX as X,
    LuUserPlus as UserPlus,
} from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Segmented from '@/components/ui/Segmented';
import { usePosLoyaltyLookup } from '@/features/pos/hooks/usePosLoyaltyLookup';
import { usePosLoyaltyEnroll } from '@/features/pos/hooks/usePosLoyaltyEnroll';
import { useDebouncedValue } from '@/features/pos/hooks/useDebouncedValue';
import type { IPosLoyaltyOwner } from '@/features/pos/hooks/useLoyaltyAttach';
import { PosLoyaltyHitBody } from './PosLoyaltyHitBody';
import { PosLoyaltyPhoneField } from './PosLoyaltyPhoneField';
import { PosLoyaltyRegisterView } from './PosLoyaltyRegisterView';
import {
    extractEnrollError,
    sanitisePhone,
    toOwner,
} from './pos-loyalty-card.helpers';
import { isValidSriLankaPhone, SRI_LANKA_PHONE_ERROR } from '@/lib/phone';

const DEBOUNCE_MS = 350;

type LoyaltyMode = 'search' | 'register';

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
 * Cashier-side loyalty attach card with two modes:
 *  - **Search**: type a phone; a valid number that matches auto-attaches the
 *    member (wallet + redeem input); a miss surfaces an "Enrol this customer"
 *    CTA.
 *  - **Register**: capture the walk-in's name and enrol them — which creates
 *    the member and attaches them to the sale immediately.
 *
 * A segmented toggle switches modes; the phone field is shared by both so the
 * typed number carries over. Backend enforces the precise redeem cap; the FE
 * only clamps to the wallet balance.
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
    const [mode, setMode] = useState<LoyaltyMode>('search');
    const [phoneRaw, setPhoneRaw] = useState('');
    const debouncedPhone = sanitisePhone(useDebouncedValue(phoneRaw, DEBOUNCE_MS));

    const lookup = usePosLoyaltyLookup(debouncedPhone);
    const enroll = usePosLoyaltyEnroll({ phone: debouncedPhone });

    // Promote a successful lookup into the page-level owner state so the
    // create-sale payload reads the same shape the cashier sees.
    useEffect(() => {
        if (loyaltyOwner) return;
        if (lookup.data) onAttach(toOwner(lookup.data));
    }, [lookup.data, loyaltyOwner, onAttach]);

    const handleClear = () => {
        onDetach();
        onRedeemChange(0);
        setPhoneRaw('');
        setMode('search');
    };

    const handleEnrol = (firstName: string, lastName: string | undefined) => {
        enroll.mutate(
            { firstName, lastName },
            { onSuccess: (result) => onAttach(toOwner(result)) },
        );
    };

    const isSearching =
        lookup.isFetching && lookup.fetchStatus !== 'idle' && !lookup.data;
    const phoneValid = isValidSriLankaPhone(debouncedPhone);
    const showMiss =
        !loyaltyOwner &&
        debouncedPhone.length > 0 &&
        lookup.data === null &&
        !lookup.isFetching;
    // Typed something that isn't a valid SL number yet — nudge, don't error.
    const showInvalid =
        !loyaltyOwner && debouncedPhone.length > 0 && !phoneValid && !isSearching;

    return (
        <section
            aria-label="Loyalty"
            className="bg-surface border border-border-strong rounded-lg p-4 flex flex-col gap-3"
        >
            <header className="flex items-center justify-between gap-2">
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
                ) : (
                    <Segmented<LoyaltyMode>
                        value={mode}
                        onChange={setMode}
                        size="sm"
                        options={[
                            { label: 'Search', value: 'search' },
                            { label: 'Register', value: 'register' },
                        ]}
                    />
                )}
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
                <>
                    <PosLoyaltyPhoneField
                        phoneRaw={phoneRaw}
                        onPhoneChange={setPhoneRaw}
                        isSearching={isSearching}
                    />

                    {showInvalid ? (
                        <p className="text-[11px] text-text-3">
                            {SRI_LANKA_PHONE_ERROR}
                        </p>
                    ) : null}

                    {lookup.isError ? (
                        <p role="alert" className="text-[11px] text-danger">
                            Could not check loyalty membership. Try again.
                        </p>
                    ) : null}

                    {mode === 'search' ? (
                        showMiss ? (
                            <div className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-surface-2/40 px-3 py-3">
                                <p className="text-[11px] text-text-2">
                                    No loyalty member found for “
                                    {debouncedPhone}”.
                                </p>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setMode('register')}
                                    className="self-start"
                                >
                                    <UserPlus size={14} aria-hidden />
                                    Enrol this customer
                                </Button>
                            </div>
                        ) : null
                    ) : (
                        <PosLoyaltyRegisterView
                            onBack={() => setMode('search')}
                            onSubmit={handleEnrol}
                            isSubmitting={enroll.isPending}
                            phoneValid={phoneValid}
                            error={extractEnrollError(enroll.error)}
                        />
                    )}
                </>
            )}
        </section>
    );
}
