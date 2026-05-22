import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { inventoryService } from '@/services/inventory.service';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME = /^image\/(jpeg|png|webp|gif)$/;

interface UseProductImageArgs {
    productId: string | undefined;
    isEditMode: boolean;
}

export function useProductImage({
    productId,
    isEditMode,
}: UseProductImageArgs) {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageSelected = useCallback(
        async (file: File) => {
            if (file.size > MAX_IMAGE_BYTES) {
                toast.error('Image must be 2 MB or smaller.');
                return;
            }
            if (!ALLOWED_MIME.test(file.type)) {
                toast.error('JPG, PNG, WebP, or GIF only.');
                return;
            }

            if (isEditMode && productId) {
                setUploadingImage(true);
                try {
                    const updated = await inventoryService.uploadProductImage(
                        productId,
                        file,
                    );
                    setImageUrl(updated.imageUrl);
                    toast.success('Image uploaded');
                } catch {
                    toast.error('Image upload failed');
                } finally {
                    setUploadingImage(false);
                }
            } else {
                setPendingImageFile(file);
                const reader = new FileReader();
                reader.onload = () => setImageUrl(String(reader.result));
                reader.readAsDataURL(file);
            }
        },
        [isEditMode, productId],
    );

    const handleRemoveImage = useCallback(async () => {
        if (isEditMode && productId) {
            setUploadingImage(true);
            try {
                await inventoryService.deleteProductImage(productId);
                setImageUrl(null);
            } catch {
                toast.error('Failed to remove image');
            } finally {
                setUploadingImage(false);
            }
        } else {
            setPendingImageFile(null);
            setImageUrl(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [isEditMode, productId]);

    return {
        imageUrl,
        setImageUrl,
        pendingImageFile,
        uploadingImage,
        fileInputRef,
        handleImageSelected,
        handleRemoveImage,
    };
}
