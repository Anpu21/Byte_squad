export function inputClasses(hasError: boolean, extra = ''): string {
    const base =
        'w-full h-[38px] px-3 bg-surface border rounded-md text-[13px] text-text-1 outline-none transition-colors focus:border-primary focus:ring-[3px] focus:ring-primary/30';
    const borderClass = hasError
        ? 'border-danger'
        : 'border-border-strong hover:border-text-3';
    return `${base} ${borderClass} ${extra}`.trim();
}
