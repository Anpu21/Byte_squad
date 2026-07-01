import { useState, type FormEvent } from 'react';
import { LuUserPlus as UserPlus } from 'react-icons/lu';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button, Input, Modal } from '@/components/ui';
import {
    isValidSriLankaPhone,
    normalizeSriLankaPhone,
    SRI_LANKA_PHONE_ERROR,
} from '@/lib/phone';
import { useEnrollLoyaltyMember } from '../hooks/useEnrollLoyaltyMember';

interface CashierLoyaltyEnrollModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Enrol a walk-in loyalty member from the browse page. Unlike store credit
 * this attaches immediately — there is no manager approval; the member can
 * earn points on their next sale. Phone is validated with the shared
 * Sri Lanka rules and normalised before submit.
 */
export function CashierLoyaltyEnrollModal({
    isOpen,
    onClose,
}: CashierLoyaltyEnrollModalProps) {
    const enroll = useEnrollLoyaltyMember();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [phone, setPhone] = useState('');

    const phoneValid = isValidSriLankaPhone(phone);
    const showPhoneError = phone.trim().length > 0 && !phoneValid;
    const canSubmit =
        firstName.trim().length > 0 &&
        lastName.trim().length > 0 &&
        phoneValid &&
        !enroll.isPending;

    function reset() {
        setFirstName('');
        setLastName('');
        setPhone('');
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const normalizedPhone = normalizeSriLankaPhone(phone);
        if (!canSubmit || !normalizedPhone) return;
        try {
            await enroll.mutateAsync({
                phone: normalizedPhone,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });
            toast.success('Loyalty member enrolled');
            reset();
            onClose();
        } catch (err: unknown) {
            toast.error(extractError(err, 'Could not enrol the member'));
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Enrol a loyalty member"
            maxWidth="md"
        >
            <form
                className="flex flex-col gap-3"
                onSubmit={handleSubmit}
                aria-label="Enrol loyalty member"
            >
                <p className="text-[12px] text-text-2">
                    Capture the walk-in's name and phone. They start earning
                    points on their very next sale.
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
                <Input
                    type="tel"
                    inputMode="tel"
                    label="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+94 77 123 4567"
                    aria-required
                />
                {showPhoneError ? (
                    <p className="text-[11px] text-text-3">
                        {SRI_LANKA_PHONE_ERROR}
                    </p>
                ) : null}
                <div className="flex items-center justify-end gap-2 pt-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" size="sm" disabled={!canSubmit}>
                        <UserPlus size={14} aria-hidden />
                        {enroll.isPending ? 'Enrolling…' : 'Enrol member'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

function extractError(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
        const data = err.response?.data as
            | { message?: string | string[] }
            | undefined;
        const msg = data?.message;
        if (Array.isArray(msg)) return msg.join(', ');
        if (typeof msg === 'string') return msg;
    }
    return fallback;
}
