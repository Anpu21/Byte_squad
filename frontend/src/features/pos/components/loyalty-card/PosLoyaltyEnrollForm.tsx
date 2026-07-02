import { useState, type FormEvent } from 'react';
import { LuUserPlus as UserPlus } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export interface IPosLoyaltyEnrollFormProps {
    onSubmit: (firstName: string, lastName: string | undefined) => void;
    isSubmitting: boolean;
    /** Whether the card-level phone is a valid SL number; gates submit. */
    phoneValid: boolean;
    /** Backend error surfaced from the enrol mutation, if any. */
    error: string | null;
}

/**
 * Name-capture half of the loyalty Register view. The card owns the phone
 * (shown in the editable phone field above; `usePosLoyaltyEnroll` is keyed on
 * it), so this form captures first name + last name and submits the enrolment
 * that attaches the walk-in to the in-progress sale. Submit is gated on a valid
 * phone so a proactive Register can't fire without one.
 */
export function PosLoyaltyEnrollForm({
    onSubmit,
    isSubmitting,
    phoneValid,
    error,
}: IPosLoyaltyEnrollFormProps) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        if (!trimmedFirst || !trimmedLast || !phoneValid) return;
        onSubmit(trimmedFirst, trimmedLast);
    };

    const canSubmit =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        phoneValid &&
        !isSubmitting;

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={handleSubmit}
            aria-label="Enrol walk-in customer"
        >
            <div className="grid grid-cols-2 gap-2">
                <Input
                    label="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Required"
                    aria-required
                    autoFocus
                />
                <Input
                    label="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Required"
                    aria-required
                />
            </div>
            {error ? (
                <p
                    role="alert"
                    className="text-[11px] text-danger font-medium"
                >
                    {error}
                </p>
            ) : null}
            <Button
                type="submit"
                disabled={!canSubmit}
                size="sm"
                className="self-start"
            >
                <UserPlus size={14} aria-hidden />
                {isSubmitting ? 'Enrolling…' : 'Enrol'}
            </Button>
        </form>
    );
}
