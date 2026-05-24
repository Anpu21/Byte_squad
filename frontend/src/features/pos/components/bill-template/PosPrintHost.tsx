import { createPortal } from 'react-dom';
import { PosBillTemplate } from './PosBillTemplate';
import type { ISale } from '@/types';

interface IPosPrintHostProps {
    sale: ISale | null;
}

/**
 * Off-screen print host portalled into `<body>`. The print stylesheet in
 * `pos-bill-template.css` only un-hides body children that carry the
 * `data-pos-print-area` attribute, so the host must be a direct child of
 * `<body>` (not nested inside `#root`) to print cleanly. Returns null when
 * idle so the DOM stays empty between sales.
 */
export function PosPrintHost({ sale }: IPosPrintHostProps): React.ReactNode {
    if (!sale) return null;
    return createPortal(
        <div
            data-pos-print-area
            aria-hidden
            style={{ position: 'absolute', left: -10000, top: 0 }}
        >
            <PosBillTemplate sale={sale} />
        </div>,
        document.body,
    );
}
