import { useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export interface IPosLoyaltyEnrollFormProps {
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
 * The form is local-stateful only — the parent supplies the phone via
 * the mutation hook (`usePosLoyaltyEnroll` is keyed on it), so we
 * never duplicate the phone here.
 */
export function PosLoyaltyEnrollForm({
    onSubmit,
    isSubmitting,
    error,
}: IPosLoyaltyEnrollFormProps) {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedFirst = firstName.trim();
        if (!trimmedFirst) return;
        const trimmedLast = lastName.trim();
        onSubmit(trimmedFirst, trimmedLast.length > 0 ? trimmedLast : undefined);
    };

    const canSubmit = firstName.trim().length > 0 && !isSubmitting;

    return (
        <form
            className="flex flex-col gap-3"
            onSubmit={handleSubmit}
            aria-label="Enrol walk-in customer"
        >
            <p className="text-[11px] text-text-2">
                No loyalty member with that phone — enrol them now to
                start earning points on this sale.
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
                    placeholder="Optional"
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
