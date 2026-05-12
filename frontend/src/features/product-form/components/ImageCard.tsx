import { Image as ImageIcon, Upload } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface ImageCardProps {
    imageUrl: string | null;
    uploadingImage: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    pendingImageFile: File | null;
    isEditMode: boolean;
    onImageSelected: (file: File) => void | Promise<void>;
    onRemove: () => void | Promise<void>;
}

export function ImageCard({
    imageUrl,
    uploadingImage,
    fileInputRef,
    pendingImageFile,
    isEditMode,
    onImageSelected,
    onRemove,
}: ImageCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="inline-flex items-center gap-2">
                    <ImageIcon size={14} />
                    Image
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="aspect-square w-full max-w-[220px] mx-auto rounded-md border border-border overflow-hidden bg-surface-2 flex items-center justify-center">
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt="Product"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-1.5 text-text-3">
                            <ImageIcon size={28} />
                            <p className="text-[11px] uppercase tracking-widest">
                                No image
                            </p>
                        </div>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    aria-label="Upload product image"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void onImageSelected(file);
                        e.target.value = '';
                    }}
                />

                <div className="flex items-center gap-2">
                    <Button
                        type="button"
                        variant={imageUrl ? 'secondary' : 'primary'}
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="flex-1"
                    >
                        <Upload size={13} />
                        {uploadingImage
                            ? 'Uploading…'
                            : imageUrl
                              ? 'Replace'
                              : 'Upload image'}
                    </Button>
                    {imageUrl && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onRemove}
                            disabled={uploadingImage}
                        >
                            Remove
                        </Button>
                    )}
                </div>
                <p className="text-[11px] text-text-3">
                    JPG, PNG, WebP or GIF · up to 2 MB.
                    {!isEditMode && pendingImageFile && (
                        <>
                            {' '}
                            Image will upload after the product is created.
                        </>
                    )}
                </p>
            </CardContent>
        </Card>
    );
}
