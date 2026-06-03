import type { MetricKey } from './format';

export const METRIC_OPTIONS: { label: string; value: MetricKey }[] = [
    { label: 'Revenue', value: 'revenue' },
    { label: 'Profit', value: 'grossProfit' },
    { label: 'Transactions', value: 'transactions' },
    { label: 'AOV', value: 'aov' },
    { label: 'Products', value: 'activeProducts' },
    { label: 'Loyalty', value: 'loyaltyMembers' },
];
