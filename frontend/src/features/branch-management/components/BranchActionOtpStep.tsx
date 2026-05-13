import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import { OtpCodeField } from '@/features/reset-password/components/OtpCodeField';
import type {
    BranchActionType,
    IBranchActionConfirmResponse,
} from '@/types';

interface BranchActionOtpStepProps {
    actionId: string;
    expiresAt: string;
    action: BranchActionType;
    branchLabel: string;
    onConfirmed: (result: IBranchActionConfirmResponse) => void;
    onCancel: () => void;
}

const ACTION_LABEL: Record<BranchActionType, string> = {
    create: 'create',
    update: 'update',
    delete: 'delete',
};

function formatCountdown(ms: number): string {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60)
        .toString()
        .padStart(2, '0');
    const s = (total % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

export function BranchActionOtpStep({
    actionId,
    expiresAt,
    action,
    branchLabel,
    onConfirmed,
    onCancel,
}: BranchActionOtpStepProps) {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [resending, setResending] = useState(false);
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

    const handleVerify = async () => {
        if (otp.length !== 6) {
            setError('Enter the 6-digit code from your email');
            return;
        }
        setSubmitting(true);
        setError(null);
        try {
            const result = await adminService.confirmBranchAction(actionId, otp);
            onConfirmed(result);
        } catch (err: unknown) {
            const axiosErr = err as {
                response?: { data?: { message?: string } };
            };
            setError(
                axiosErr.response?.data?.message ??
                    'Could not verify code. Please try again.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError(null);
        try {
            const { expiresAt: nextExpiresAt } =
                await adminService.resendBranchActionOtp(actionId);
            setDeadline(new Date(nextExpiresAt).getTime());
            setOtp('');
            toast.success('A fresh code was sent to your email');
        } catch (err: unknown) {
            const axiosErr = err as {
                response?: { data?: { message?: string } };
            };
            toast.error(
                axiosErr.response?.data?.message ?? 'Could not resend code',
            );
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="space-y-5">
            <div className="rounded-md border border-border bg-surface-2 px-4 py-3">
                <p className="text-[11px] uppercase tracking-widest text-text-3 font-semibold">
                    Confirm {ACTION_LABEL[action]} branch
                </p>
                <p className="mt-1 text-sm text-text-1">
                    We emailed a 6-digit verification code. Enter it below to
                    finish {ACTION_LABEL[action]}-ing{' '}
                    <span className="font-semibold">{branchLabel}</span>.
                </p>
            </div>

            <OtpCodeField
                id={`branch-otp-${actionId}`}
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
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 h-10 rounded-lg border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="flex-1 h-10 rounded-lg border border-border text-text-1 text-sm font-medium hover:bg-surface-2 transition-colors disabled:opacity-50"
                >
                    {resending ? 'Sending…' : 'Resend code'}
                </button>
                <button
                    type="button"
                    onClick={handleVerify}
                    disabled={submitting || otp.length !== 6 || expired}
                    className="flex-1 h-10 rounded-lg bg-primary text-text-inv text-sm font-bold hover:bg-primary-hover transition-all disabled:opacity-50"
                >
                    {submitting ? 'Verifying…' : 'Verify & continue'}
                </button>
            </div>
        </div>
    );
}
