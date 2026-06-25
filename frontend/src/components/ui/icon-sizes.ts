/**
 * Numeric icon sizes for react-icons, which take a `size` *number* prop — not a
 * CSS length, so the `--icon-*` tokens in index.css can't feed them directly.
 * Keep these in sync with those tokens. Use them instead of inline magic numbers
 * so nav/chrome iconography stays consistent.
 */
export const ICON = {
    xs: 12, // breadcrumb chevrons, inline meta
    sm: 14, // dropdown menu-item leading icons
    md: 16, // header control glyphs, theme toggle
    lg: 18, // sidebar nav icons, menu toggle, bell
} as const;

/** The primary-sidebar nav icon size. */
export const NAV_ICON = ICON.lg;
