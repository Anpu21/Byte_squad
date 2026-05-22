import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { userService } from '@/services/user.service';
import { OtpCodeField } from '@/features/reset-password/components/OtpCodeField';
import Button from '@/components/ui/Button';
import type {
    UserActionType,
    IUserActionConfirmResponse,
} from '@/types';

interface UserActionOtpStepProps {
    actionId: string;
    expiresAt: string;
    action: UserActionType;
    targetLabel: string;
    onConfirmed: (result: IUserActionConfirmResponse) => void;
    onCancel: () => void;
}

const ACTION_VERB: Record<UserActionType, string> = {
    create: 'create',
    update: 'update',
    delete: 'delete',
    'reset-password': 'reset password for',
};

function formatCountdown(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60)
        .toString()
        .padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function extractApiMessage(err: unknown): string | undefined {
    const axiosErr = err as { response?: { data?: { message?: string } } };
    return axiosErr?.response?.data?.message;
}

export function UserActionOtpStep({
    actionId,
    expiresAt,
    action,
    targetLabel,
    onConfirmed,
    onCancel,
}: UserActionOtpStepProps) {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [deadline, setDeadline] = useState(() =>
        new Date(expiresAt).getTime(),
    );
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, []);

    const remaining = deadline - now;
    const expired = remaining <= 0;

    const verifyMutation = useMutation({
        mutationFn: () => userService.confirmUserAction(actionId, otp),
        onSuccess: (result) => onConfirmed(result),
        onError: (err: unknown) =>
            setError(
                extractApiMessage(err) ??
                    'Could not verify code. Please try again.',
            ),
    });

    const resendMutation = useMutation({
        mutationFn: () => userService.resendUserActionOtp(actionId),
        onSuccess: ({ expiresAt: nextExpiresAt }) => {
            setDeadline(new Date(nextExpiresAt).getTime());
            setOtp('');
            setError(null);
            toast.success('A fresh code was sent to your email');
        },
        onError: (err: unknown) =>
            toast.error(extractApiMessage(err) ?? 'Could not resend code'),
    });

    const handleVerify = () => {
        if (otp.length !== 6) {
            setError('Enter the 6-digit code from your email');
            return;
        }
        setError(null);
        verifyMutation.mutate();
    };

    return (
        <div className="space-y-5">
            <div className="rounded-md border border-border bg-surface-2 px-4 py-3">
                <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">
                    Confirm action
                </p>
                <p className="mt-1 text-sm text-text-1">
                    We emailed a 6-digit verification code. Enter it below to
                    finish {ACTION_VERB[action]}{' '}
                    <span className="font-semibold">{targetLabel}</span>.
                </p>
            </div>

            <OtpCodeField
                id={`user-otp-${actionId}`}
                label="Verification code"
                value={otp}
                onChange={(v) => {
                    setOtp(v);
                    if (error) setError(null);
                }}
                error={error ?? undefined}
                hint={
                    expired
                        ? 'Code expired. Resend a new one to continue.'
                        : `Expires in ${formatCountdown(remaining)}`
                }
                size="lg"
                autoFocus
                required
            />

            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-1">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={onCancel}
                    className="flex-1"
                >
                    Cancel
                </Button>
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => resendMutation.mutate()}
                    disabled={resendMutation.isPending}
                    className="flex-1"
                >
                    {resendMutation.isPending ? 'Sending…' : 'Resend code'}
                </Button>
                <Button
                    type="button"
                    onClick={handleVerify}
                    disabled={
                        verifyMutation.isPending ||
                        otp.length !== 6 ||
                        expired
                    }
                    className="flex-1"
                >
                    {verifyMutation.isPending
                        ? 'Verifying…'
                        : 'Verify & continue'}
                </Button>
            </div>
        </div>
    );
}
