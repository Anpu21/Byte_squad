import { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { FIELD_SHELL, FIELD_ERROR } from '@/components/ui';
import type { IGrn } from '@/types';
import { useVoidGrn } from '../../hooks/useVoidGrn';

interface GrnVoidSectionProps {
    grn: IGrn;
    canVoid: boolean;
    onClose: () => void;
}

/** Admin-only, reason-gated void action — reverses stock and the ledger posting. */
export function GrnVoidSection({ grn, canVoid, onClose }: GrnVoidSectionProps) {
    const voidGrn = useVoidGrn();
    const [voidReason, setVoidReason] = useState('');
    const [voiding, setVoiding] = useState(false);

    if (!canVoid) return null;

    async function handleVoid() {
        if (voidReason.trim().length < 3) return;
        try {
            await voidGrn.mutateAsync({ id: grn.id, reason: voidReason.trim() });
            toast.success(`${grn.grnNumber} voided`);
            setVoiding(false);
            setVoidReason('');
            onClose();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const data = err.response?.data as
                    | { message?: string }
                    | undefined;
                toast.error(data?.message ?? 'Could not void GRN');
            } else {
                toast.error('Could not void GRN');
            }
        }
    }

    return (
        <>
            {!voiding && (
                <div className="flex justify-end">
                    <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setVoiding(true)}
                    >
                        Void GRN
                    </Button>
                </div>
            )}

            {voiding && (
                <div className="space-y-2 p-3 rounded-md border border-danger/40 bg-danger-soft/40">
                    <p className="text-xs text-text-2">
                        Voiding reverses the received stock and the ledger
                        posting. Refused if the goods were already sold.
                    </p>
                    <textarea
                        className={`${FIELD_SHELL} ${FIELD_ERROR} w-full min-h-[56px] px-3 py-2`}
                        placeholder="Reason (required)"
                        value={voidReason}
                        onChange={(e) => setVoidReason(e.target.value)}
                        maxLength={500}
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setVoiding(false)}
                            disabled={voidGrn.isPending}
                        >
                            Keep GRN
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => void handleVoid()}
                            disabled={
                                voidGrn.isPending ||
                                voidReason.trim().length < 3
                            }
                        >
                            {voidGrn.isPending ? 'Voiding…' : 'Confirm void'}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
