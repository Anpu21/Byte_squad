import { type FormEvent, useState } from 'react';
import { LuSave as Save, LuRotateCcw as RotateCcw } from 'react-icons/lu';
import Button from '@/components/ui/Button';
import { useLoyaltySettingsAdmin } from '../hooks/useLoyaltySettingsAdmin';
import {
    type FormState,
    toForm,
    toPreview,
    validate,
} from '../lib/loyalty-settings';
import { LoyaltySettingsSections } from './LoyaltySettingsSections';

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

            <LoyaltySettingsSections
                form={form}
                onChange={handleChange}
                preview={preview}
            />
        </form>
    );
}
