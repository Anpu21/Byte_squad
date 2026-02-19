import { clsx, type ClassValue } from 'clsx';

/**
 * Utility to conditionally merge class names.
 * Replaces the common cn() / classnames() pattern.
 */
export function cn(...inputs: ClassValue[]): string {
    return clsx(inputs);
}

/**
 * Format a number as currency.
 */
export function formatCurrency(
    amount: number,
    currency = 'USD',
    locale = 'en-US',
): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
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
