import { FIELD_SHELL, FIELD_BORDER, FIELD_ERROR } from '@/components/ui';

/**
 * Shared input styling for every employee-form text/date/time/select.
 * Mirrors the product-form `inputClasses` helper so both surfaces
 * feel like the same form system.
 */
export function inputClasses(hasError: boolean, extra = ''): string {
    const border = hasError ? FIELD_ERROR : FIELD_BORDER;
    return `${FIELD_SHELL} ${border} w-full h-[38px] px-3 ${extra}`.trim();
}
