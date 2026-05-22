import { type FormEvent, useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { ILoyaltySettings } from '@/types';
import {
    formatEarnRule,
    formatPointValueRule,
    formatRedeemCapRule,
} from '@/features/loyalty/lib/format-loyalty-rules';
import { useLoyaltySettingsAdmin } from '../hooks/useLoyaltySettingsAdmin';

interface FormState {
    earnPoints: string;
    earnPerAmount: string;
    pointValue: string;
    redeemCapPercent: string;
}

function toForm(s: ILoyaltySettings | undefined): FormState {
    return {
        earnPoints: String(s?.earnPoints ?? 1),
        earnPerAmount: String(s?.earnPerAmount ?? 100),
        pointValue: String(s?.pointValue ?? 1),
        redeemCapPercent: String(s?.redeemCapPercent ?? 20),
    };
}

function toPreview(form: FormState): ILoyaltySettings {
    return {
        id: 'preview',
        earnPoints: Number(form.earnPoints) || 0,
        earnPerAmount: Number(form.earnPerAmount) || 1,
        pointValue: Number(form.pointValue) || 0,
        redeemCapPercent: Number(form.redeemCapPercent) || 0,
        updatedByUserId: null,
        updatedAt: new Date().toISOString(),
    };
}

function validate(form: FormState): string | null {
    const earnPoints = Number(form.earnPoints);
    const earnPerAmount = Number(form.earnPerAmount);
    const pointValue = Number(form.pointValue);
    const cap = Number(form.redeemCapPercent);
    if (!Number.isInteger(earnPoints) || earnPoints < 0) {
        return 'Points earned must be a non-negative integer.';
    }
    if (!Number.isInteger(earnPerAmount) || earnPerAmount < 1) {
        return 'LKR amount must be a positive integer.';
    }
    if (!Number.isFinite(pointValue) || pointValue < 0) {
        return 'Point value must be 0 or higher.';
    }
    if (!Number.isInteger(cap) || cap < 0 || cap > 100) {
        return 'Redemption cap must be between 0 and 100.';
    }
    return null;
}

export function LoyaltySettingsForm() {
    const { query, mutation } = useLoyaltySettingsAdmin();
    const settings = query.data;
    const [form, setForm] = useState<FormState>(() => toForm(settings));
    const [hydratedFor, setHydratedFor] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const hydrationKey = settings ? settings.updatedAt : null;
    if (hydrationKey && hydrationKey !== hydratedFor) {
        setHydratedFor(hydrationKey);
        setForm(toForm(settings));
    }

    const handleChange = (key: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        if (error) setError(null);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const validation = validate(form);
        if (validation) {
            setError(validation);
            return;
        }
        mutation.mutate({
            earnPoints: Number(form.earnPoints),
            earnPerAmount: Number(form.earnPerAmount),
            pointValue: Number(form.pointValue),
            redeemCapPercent: Number(form.redeemCapPercent),
        });
    };

    const handleReset = () => {
        setForm(toForm(settings));
        setError(null);
    };

    const preview = toPreview(form);

    return (
        <Card className="p-5">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <p className="text-[11px] uppercase tracking-[0.1em] text-text-3 font-semibold mb-2">
                        Earn rule
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                            label="Points earned"
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            value={form.earnPoints}
                            onChange={(e) =>
                                handleChange('earnPoints', e.target.value)
                            }
                        />
                        <Input
                            label="Per LKR amount"
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            value={form.earnPerAmount}
                            onChange={(e) =>
                                handleChange('earnPerAmount', e.target.value)
                            }
                        />
                    </div>
                    <p className="text-[12px] text-text-2 mt-2">
                        {formatEarnRule(preview)}
                    </p>
                </div>

                <div>
                    <p className="text-[11px] uppercase tracking-[0.1em] text-text-3 font-semibold mb-2">
                        Point value
                    </p>
                    <Input
                        label="Value of 1 point (LKR)"
                        type="number"
                        min={0}
                        step={0.01}
                        inputMode="decimal"
                        value={form.pointValue}
                        onChange={(e) =>
                            handleChange('pointValue', e.target.value)
                        }
                    />
                    <p className="text-[12px] text-text-2 mt-2">
                        {formatPointValueRule(preview)}
                    </p>
                </div>

                <div>
                    <p className="text-[11px] uppercase tracking-[0.1em] text-text-3 font-semibold mb-2">
                        Redemption cap
                    </p>
                    <Input
                        label="Cap (% of order subtotal)"
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        inputMode="numeric"
                        value={form.redeemCapPercent}
                        onChange={(e) =>
                            handleChange('redeemCapPercent', e.target.value)
                        }
                    />
                    <p className="text-[12px] text-text-2 mt-2">
                        {formatRedeemCapRule(preview)}
                    </p>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="p-2.5 bg-danger-soft border border-danger/30 rounded-md text-xs text-danger"
                    >
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleReset}
                        disabled={mutation.isPending}
                    >
                        <RotateCcw size={13} />
                        Reset
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        <Save size={13} />
                        {mutation.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
