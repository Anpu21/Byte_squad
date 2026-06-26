import { type FormEvent, useState } from 'react';
import { LuSave as Save, LuRotateCcw as RotateCcw } from 'react-icons/lu';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { ILoyaltySettings } from '@/types';
import {
    formatEarnRule,
    formatPointValueRule,
    formatRedeemCapRule,
    formatTierRule,
} from '@/features/loyalty/lib/format-loyalty-rules';
import { useLoyaltySettingsAdmin } from '../hooks/useLoyaltySettingsAdmin';

interface FormState {
    earnPoints: string;
    earnPerAmount: string;
    pointValue: string;
    redeemCapPercent: string;
    minRedeemablePoints: string;
    silverTierPoints: string;
    goldTierPoints: string;
}

function toForm(s: ILoyaltySettings | undefined): FormState {
    return {
        earnPoints: String(s?.earnPoints ?? 1),
        earnPerAmount: String(s?.earnPerAmount ?? 100),
        pointValue: String(s?.pointValue ?? 1),
        redeemCapPercent: String(s?.redeemCapPercent ?? 20),
        minRedeemablePoints: String(s?.minRedeemablePoints ?? 100),
        silverTierPoints: String(s?.silverTierPoints ?? 1000),
        goldTierPoints: String(s?.goldTierPoints ?? 5000),
    };
}

function toPreview(form: FormState): ILoyaltySettings {
    return {
        id: 'preview',
        earnPoints: Number(form.earnPoints) || 0,
        earnPerAmount: Number(form.earnPerAmount) || 1,
        pointValue: Number(form.pointValue) || 0,
        redeemCapPercent: Number(form.redeemCapPercent) || 0,
        minRedeemablePoints: Number(form.minRedeemablePoints) || 0,
        silverTierPoints: Number(form.silverTierPoints) || 0,
        goldTierPoints: Number(form.goldTierPoints) || 0,
        updatedByUserId: null,
        updatedAt: new Date().toISOString(),
    };
}

function validate(form: FormState): string | null {
    const earnPoints = Number(form.earnPoints);
    const earnPerAmount = Number(form.earnPerAmount);
    const pointValue = Number(form.pointValue);
    const cap = Number(form.redeemCapPercent);
    const minRedeemablePoints = Number(form.minRedeemablePoints);
    const silverTierPoints = Number(form.silverTierPoints);
    const goldTierPoints = Number(form.goldTierPoints);
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
    if (!Number.isInteger(minRedeemablePoints) || minRedeemablePoints < 0) {
        return 'Minimum redeemable reserve must be a non-negative integer.';
    }
    if (!Number.isInteger(silverTierPoints) || silverTierPoints < 0) {
        return 'Silver tier threshold must be a non-negative integer.';
    }
    if (!Number.isInteger(goldTierPoints) || goldTierPoints < 0) {
        return 'Gold tier threshold must be a non-negative integer.';
    }
    if (silverTierPoints > goldTierPoints) {
        return 'Silver tier threshold cannot exceed Gold.';
    }
    return null;
}

function SettingSection({
    title,
    description,
    children,
}: {
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6 border-b border-border-strong last:border-0">
            <div className="lg:col-span-1">
                <h3 className="text-[14px] font-semibold text-text-1 mb-1.5">{title}</h3>
                <p className="text-[13px] text-text-2 leading-relaxed pr-4">
                    {description}
                </p>
            </div>
            <div className="lg:col-span-2">
                <Card className="p-5 shadow-sm space-y-4">
                    {children}
                </Card>
            </div>
        </div>
    );
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        mutation.mutate({
            earnPoints: Number(form.earnPoints),
            earnPerAmount: Number(form.earnPerAmount),
            pointValue: Number(form.pointValue),
            redeemCapPercent: Number(form.redeemCapPercent),
            minRedeemablePoints: Number(form.minRedeemablePoints),
            silverTierPoints: Number(form.silverTierPoints),
            goldTierPoints: Number(form.goldTierPoints),
        });
    };

    const handleReset = () => {
        setForm(toForm(settings));
        setError(null);
    };

    const preview = toPreview(form);

    const rightAdornment = (text: string) => (
        <span className="text-[11px] font-semibold tracking-wider text-text-3 px-2 uppercase">
            {text}
        </span>
    );

    return (
        <form onSubmit={handleSubmit} className="flex flex-col min-h-full">
            <div className="flex items-center justify-between bg-surface border border-border-strong rounded-lg p-4 mb-6 shadow-sm">
                <div>
                    <h2 className="text-[14px] font-semibold text-text-1">Loyalty Configuration</h2>
                    <p className="text-[12px] text-text-2 mt-0.5">Manage earn rules, redemption caps, and member tiers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={handleReset}
                        disabled={mutation.isPending}
                    >
                        <RotateCcw size={14} />
                        Discard changes
                    </Button>
                    <Button type="submit" disabled={mutation.isPending}>
                        <Save size={14} />
                        {mutation.isPending ? 'Saving…' : 'Save changes'}
                    </Button>
                </div>
            </div>

            {error && (
                <div
                    role="alert"
                    className="p-3 mb-6 bg-danger-soft border border-danger/30 rounded-md text-[13px] font-medium text-danger animate-in fade-in"
                >
                    {error}
                </div>
            )}

            <div className="bg-surface rounded-lg border border-border-strong px-6 mb-16 shadow-sm">
                <SettingSection
                    title="Points Generation"
                    description="Determine how customers earn points from their purchases. This applies to the subtotal amount after discounts."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Points earned"
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            value={form.earnPoints}
                            onChange={(e) => handleChange('earnPoints', e.target.value)}
                            rightSlot={rightAdornment('pts')}
                        />
                        <Input
                            label="Per spend amount"
                            type="number"
                            min={1}
                            step={1}
                            inputMode="numeric"
                            value={form.earnPerAmount}
                            onChange={(e) => handleChange('earnPerAmount', e.target.value)}
                            rightSlot={rightAdornment('LKR')}
                        />
                    </div>
                    <div className="p-3 bg-surface-2 rounded-md border border-border mt-2">
                        <p className="text-[12px] text-text-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            {formatEarnRule(preview)}
                        </p>
                    </div>
                </SettingSection>

                <SettingSection
                    title="Value & Redemption"
                    description="Configure the monetary value of points and place guardrails on how much can be redeemed per order."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <Input
                            label="Value of 1 point"
                            type="number"
                            min={0}
                            step={0.01}
                            inputMode="decimal"
                            value={form.pointValue}
                            onChange={(e) => handleChange('pointValue', e.target.value)}
                            rightSlot={rightAdornment('LKR')}
                            className="sm:col-span-2"
                        />
                    </div>
                    <div className="p-3 bg-surface-2 rounded-md border border-border mb-6">
                        <p className="text-[12px] text-text-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            {formatPointValueRule(preview)}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Redemption Cap"
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            inputMode="numeric"
                            value={form.redeemCapPercent}
                            onChange={(e) => handleChange('redeemCapPercent', e.target.value)}
                            rightSlot={rightAdornment('%')}
                        />
                        <Input
                            label="Minimum Reserve"
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            value={form.minRedeemablePoints}
                            onChange={(e) => handleChange('minRedeemablePoints', e.target.value)}
                            rightSlot={rightAdornment('pts')}
                        />
                    </div>
                    <div className="p-3 bg-surface-2 rounded-md border border-border mt-2">
                        <p className="text-[12px] text-text-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            {formatRedeemCapRule(preview)}
                        </p>
                    </div>
                </SettingSection>

                <SettingSection
                    title="VIP Tiers"
                    description="Reward your best customers with automatic status upgrades based on lifetime points."
                >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Silver tier threshold"
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            value={form.silverTierPoints}
                            onChange={(e) => handleChange('silverTierPoints', e.target.value)}
                            rightSlot={rightAdornment('pts')}
                        />
                        <Input
                            label="Gold tier threshold"
                            type="number"
                            min={0}
                            step={1}
                            inputMode="numeric"
                            value={form.goldTierPoints}
                            onChange={(e) => handleChange('goldTierPoints', e.target.value)}
                            rightSlot={rightAdornment('pts')}
                        />
                    </div>
                    <div className="p-3 bg-surface-2 rounded-md border border-border mt-2">
                        <p className="text-[12px] text-text-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            {formatTierRule(preview)}
                        </p>
                    </div>
                </SettingSection>
            </div>
        </form>
    );
}
