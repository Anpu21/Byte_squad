export const SRI_LANKA_PHONE_REGEX = /^\+94[1-9][0-9]{8}$/;

export function normalizeSriLankaPhone(input: string): string | null {
    const stripped = input.replace(/[\s\-()]/g, '');
    if (stripped.length === 0) return null;

    let candidate: string;
    if (stripped.startsWith('+94')) {
        candidate = stripped;
    } else if (stripped.startsWith('0094')) {
        candidate = '+' + stripped.slice(2);
    } else if (stripped.startsWith('0')) {
        candidate = '+94' + stripped.slice(1);
    } else {
        return null;
    }

    return SRI_LANKA_PHONE_REGEX.test(candidate) ? candidate : null;
}

export function isValidSriLankaPhone(input: string): boolean {
    return normalizeSriLankaPhone(input) !== null;
}

export const SRI_LANKA_PHONE_ERROR =
    'Enter a Sri Lanka phone number (e.g. +94 77 123 4567 or 077 123 4567).';
