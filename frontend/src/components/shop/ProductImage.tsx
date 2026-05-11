import { useState } from 'react';

interface ProductImageProps {
    src?: string | null;
    alt: string;
    /** Tailwind classes for the wrapper. Caller controls size, rounding, etc. */
    wrapperClassName?: string;
    /** Tailwind classes for the <img>. Defaults to object-cover full bleed. */
    imgClassName?: string;
    /** Override fallback content (e.g. an icon). Defaults to "No image" text. */
    fallback?: React.ReactNode;
}

/**
 * Renders a product image with a graceful in-DOM fallback when the URL is
 * missing or fails to load. Replaces ad-hoc `failedImages` Sets that were
 * duplicated across CartPage / CartDrawer / CatalogPage.
 */
export default function ProductImage({
    src,
    alt,
    wrapperClassName = 'w-16 h-16 bg-canvas rounded-lg overflow-hidden flex items-center justify-center',
    imgClassName = 'w-full h-full object-cover',
    fallback,
}: ProductImageProps) {
    const [failed, setFailed] = useState(false);
    const showImage = !!src && !failed;
    return (
        <div className={wrapperClassName}>
            {showImage ? (
                <img
                    src={src!}
                    alt={alt}
                    onError={() => setFailed(true)}
                    className={imgClassName}
                    loading="lazy"
                />
            ) : (
                fallback ?? <span className="text-text-3 text-[10px]">No image</span>
            )}
        </div>
    );
}
