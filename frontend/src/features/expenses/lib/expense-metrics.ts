import type { IExpense } from '@/types';
import { ExpenseStatus } from '@/constants/enums';

const MS_PER_DAY = 86400000;
const SPARKLINE_DAYS = 14;

export interface ExpensesMetrics {
    thisMonthTotal: number;
    lastMonthTotal: number;
    monthOverMonthDelta: number | null;
    largestCategory: { name: string; amount: number } | null;
    last14DaysTotals: number[];
    pendingCount: number;
    approvedCount: number;
    categories: string[];
}

function isInMonth(date: Date, month: number, year: number): boolean {
    return date.getMonth() === month && date.getFullYear() === year;
}

export function computeExpensesMetrics(expenses: IExpense[]): ExpensesMetrics {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    let thisMonthTotal = 0;
    let lastMonthTotal = 0;
    let pendingCount = 0;
    let approvedCount = 0;
    const categoryTotals = new Map<string, number>();
    const categorySet = new Set<string>();

    const buckets: number[] = new Array(SPARKLINE_DAYS).fill(0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sparkStart = today.getTime() - (SPARKLINE_DAYS - 1) * MS_PER_DAY;

    for (const e of expenses) {
        const amount = Number(e.amount);
        categorySet.add(e.category);
        if (e.status === ExpenseStatus.PENDING) pendingCount++;
        if (e.status === ExpenseStatus.APPROVED) approvedCount++;

        const date = new Date(e.expenseDate);
        if (isInMonth(date, thisMonth, thisYear)) {
            thisMonthTotal += amount;
            categoryTotals.set(
                e.category,
                (categoryTotals.get(e.category) ?? 0) + amount,
            );
        }
        if (isInMonth(date, lastMonth, lastMonthYear)) {
            lastMonthTotal += amount;
        }

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const diff = Math.floor((dayStart.getTime() - sparkStart) / MS_PER_DAY);
        if (diff >= 0 && diff < SPARKLINE_DAYS) {
            buckets[diff] += amount;
        }
    }

    let topName = '';
    let topAmount = 0;
    for (const [name, amount] of categoryTotals) {
        if (amount > topAmount) {
            topName = name;
            topAmount = amount;
        }
    }

    return {
        thisMonthTotal,
        lastMonthTotal,
        monthOverMonthDelta:
            lastMonthTotal === 0
                ? null
                : ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100,
        largestCategory: topName ? { name: topName, amount: topAmount } : null,
        last14DaysTotals: buckets,
        pendingCount,
        approvedCount,
        categories: [...categorySet].sort(),
    };
}
