import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import type { ILoyaltySettings } from '@/types';
import {
    formatEarnRule,
    formatPointValueRule,
    formatRedeemCapRule,
    formatTierRule,
} from '@/features/loyalty/lib/format-loyalty-rules';
import type { FormState } from '../lib/loyalty-settings';

const rightAdornment = (text: string) => (
    <span className="text-[11px] font-semibold tracking-wider text-text-3 px-2 uppercase">
        {text}
    </span>
);

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

interface LoyaltySettingsSectionsProps {
    form: FormState;
    onChange: (key: keyof FormState, value: string) => void;
    preview: ILoyaltySettings;
}

/** The three loyalty-config sections (earn, value/redemption, tiers). */
export function LoyaltySettingsSections({
    form,
    onChange,
    preview,
}: LoyaltySettingsSectionsProps) {
    return (
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
                        onChange={(e) => onChange('earnPoints', e.target.value)}
                        rightSlot={rightAdornment('pts')}
                    />
                    <Input
                        label="Per spend amount"
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        value={form.earnPerAmount}
                        onChange={(e) => onChange('earnPerAmount', e.target.value)}
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
                        onChange={(e) => onChange('pointValue', e.target.value)}
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
                        onChange={(e) => onChange('redeemCapPercent', e.target.value)}
                        rightSlot={rightAdornment('%')}
                    />
                    <Input
                        label="Minimum Reserve"
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={form.minRedeemablePoints}
                        onChange={(e) => onChange('minRedeemablePoints', e.target.value)}
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
                        onChange={(e) => onChange('silverTierPoints', e.target.value)}
                        rightSlot={rightAdornment('pts')}
                    />
                    <Input
                        label="Gold tier threshold"
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        value={form.goldTierPoints}
                        onChange={(e) => onChange('goldTierPoints', e.target.value)}
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
    );
}
