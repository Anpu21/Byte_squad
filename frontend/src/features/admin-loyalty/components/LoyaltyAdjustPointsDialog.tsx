import { useState } from 'react';
import { Loader2, Plus, Minus } from 'lucide-react';
import { useLoyaltyAdjustPoints } from '../hooks/useLoyaltyAdjustPoints';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface LoyaltyAdjustPointsDialogProps {
    userId: string;
    customerName: string;
    isOpen: boolean;
    onClose: () => void;
}

export function LoyaltyAdjustPointsDialog({
    userId,
    customerName,
    isOpen,
    onClose,
}: LoyaltyAdjustPointsDialogProps) {
    const { mutate: adjustPoints, isPending } = useLoyaltyAdjustPoints();
    const [type, setType] = useState<'add' | 'deduct'>('add');
    const [points, setPoints] = useState<string>('');
    const [reason, setReason] = useState<string>('');
    const [error, setError] = useState<string>('');

    const isDeduct = type === 'deduct';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const numPoints = parseInt(points, 10);
        if (isNaN(numPoints) || numPoints <= 0) {
            setError('Points must be a positive number');
            return;
        }

        if (reason.trim().length < 3) {
            setError('Reason must be at least 3 characters');
            return;
        }

        const finalPoints = isDeduct ? -numPoints : numPoints;
        
        adjustPoints(
            { userId, points: finalPoints, reason },
            {
                onSuccess: () => {
                    setPoints('');
                    setReason('');
                    onClose();
                },
            }
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Adjust Loyalty Points"
            maxWidth="md"
        >
            <div className="mb-4 text-sm text-text-2">
                Manually add or deduct points for <span className="font-semibold">{customerName}</span>. This will be recorded in the ledger.
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-text-1">Adjustment Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="add"
                                checked={type === 'add'}
                                onChange={() => setType('add')}
                                className="accent-primary"
                            />
                            <span className="flex items-center text-sm">
                                <Plus className="w-4 h-4 mr-1 text-green-600" />
                                Add Points
                            </span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="deduct"
                                checked={type === 'deduct'}
                                onChange={() => setType('deduct')}
                                className="accent-primary"
                            />
                            <span className="flex items-center text-sm">
                                <Minus className="w-4 h-4 mr-1 text-danger" />
                                Deduct Points
                            </span>
                        </label>
                    </div>
                </div>

                <Input
                    label="Points Amount"
                    type="number"
                    min="1"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    required
                />

                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-text-1">Reason</label>
                    <textarea
                        className="w-full h-24 px-3 py-2 text-sm bg-surface border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                        placeholder="E.g. Goodwill gesture, system correction..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                    />
                </div>

                {error && <div className="text-sm text-danger">{error}</div>}

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant={isDeduct ? 'danger' : 'primary'}
                        disabled={isPending}
                    >
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isDeduct ? 'Deduct Points' : 'Add Points'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
