import { FIELD_SHELL, FIELD_BORDER, FIELD_ERROR } from '@/components/ui';

/**
 * Sharp single-line field classes for the product form. Shares the app-wide
 * field language (FIELD_SHELL + border state) at this form's compact 38px
 * height; the visible label is supplied by the surrounding <FormField>.
 */
export function inputClasses(hasError: boolean, extra = ''): string {
    return `${FIELD_SHELL} w-full h-[38px] px-3 ${
        hasError ? FIELD_ERROR : FIELD_BORDER
    } ${extra}`.trim();
}

/** Multi-line variant of {@link inputClasses} for product-form textareas. */
export function textareaClasses(hasError: boolean, extra = ''): string {
    return `${FIELD_SHELL} w-full px-3 py-2 ${
        hasError ? FIELD_ERROR : FIELD_BORDER
    } ${extra}`.trim();
}
