import { clsx, type ClassValue } from 'clsx';

/**
 * Utility to conditionally merge class names.
 * Replaces the common cn() / classnames() pattern.
 */
export function cn(...inputs: ClassValue[]): string {
    return clsx(inputs);
}

// Fall back to the default when a caller passes a non-ISO currency. Guards the
// common footgun of wiring formatCurrency straight into a charting lib, which
// invokes formatters as (value, index|name, …) — the extra positional arg would
// otherwise reach `currency` and throw a RangeError that white-screens the route.
function safeCurrency(currency: unknown): string {
    return typeof currency === 'string' && currency.length === 3
        ? currency
        : 'LKR';
}

/**
 * Format a number as currency.
 */
export function formatCurrency(
    amount: number,
    currency = 'LKR',
    locale = 'en-LK',
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: safeCurrency(currency),
    }).format(amount);
}

/**
 * Format a number as whole currency (no decimals) — for dense chart legends
 * and summary tiles where cents are noise.
 */
export function formatCurrencyWhole(
    amount: number,
    currency = 'LKR',
    locale = 'en-LK',
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: safeCurrency(currency),
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Generate a short unique ID (for client-side cart items, etc.)
 */
export function generateId(): string {
    return Math.random().toString(36).substring(2, 11);
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
}


export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}