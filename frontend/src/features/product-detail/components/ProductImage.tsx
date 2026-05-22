import { useState } from 'react';

interface ProductImageProps {
    src: string | null | undefined;
    alt: string;
}

export function ProductDetailImage({ src, alt }: ProductImageProps) {
    const [failed, setFailed] = useState(false);

    return (
        <div className="aspect-square bg-surface border border-border rounded-md overflow-hidden flex items-center justify-center">
            {src && !failed ? (
                <img
                    src={src}
                    alt={alt}
                    onError={() => setFailed(true)}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className="text-text-3 text-sm">No image</span>
            )}
        </div>
    );
}
