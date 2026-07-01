import { useState, type FormEvent } from 'react';
import { LuUserPlus as UserPlus } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export interface IPosLoyaltyEnrollFormProps {
    /** The normalised phone being enrolled, shown read-only for confirmation. */
    phone: string;
    onSubmit: (firstName: string, lastName: string | undefined) => void;
    isSubmitting: boolean;
    /** Backend error surfaced from the enrol mutation, if any. */
    error: string | null;
}

/**
 * Inline enrol form mounted inside the loyalty card when a phone
 * lookup returns 404. Captures first name (required) + last name
 * (optional) so the cashier doesn't have to leave the POS to attach
 * a walk-in to the in-progress sale.
 *
 * The form is local-stateful for the names only — the parent owns the
 * phone (`usePosLoyaltyEnroll` is keyed on it); we show it read-only
 * here purely as confirmation of who is being enrolled.
 */
export function PosLoyaltyEnrollForm({
    phone,
    onSubmit,
    isSubmitting,
    error,
}: IPosLoyaltyEnrollFormProps) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedFirst = firstName.trim();
        const trimmedLast = lastName.trim();
        if (!trimmedFirst || !trimmedLast) return;
        onSubmit(trimmedFirst, trimmedLast);
    };

    const canSubmit =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        !isSubmitting;

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={handleSubmit}
            aria-label="Enrol walk-in customer"
        >
            <p className="text-[11px] text-text-2">
                No loyalty member with{' '}
                <span className="font-medium text-text-1">{phone}</span> — enrol
                them now to start earning points on this sale.
            </p>
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
