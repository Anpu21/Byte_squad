import { useState } from 'react';
import toast from 'react-hot-toast';
import { useUploadEmployeePhoto } from '@/features/admin-employees';

interface UseEmployeePhotoUploadArgs {
    employeeId: string | null;
}

/**
 * Owns the photoUrl preview + upload mutation for the employee form.
 * The BE photo endpoint requires the employee row to exist already,
 * so on the create page the upload button is disabled until after
 * the first save.
 */
export function useEmployeePhotoUpload({ employeeId }: UseEmployeePhotoUploadArgs) {
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const uploadMutation = useUploadEmployeePhoto();

    const handleFileSelected = async (file: File): Promise<void> => {
        if (!employeeId) {
            toast.error('Save the employee first, then upload a photo.');
            return;
        }
        try {
            const next = await uploadMutation.mutateAsync({
                id: employeeId,
                file,
            });
            setPhotoUrl(next.photoUrl);
            toast.success('Photo updated');
        } catch {
            toast.error('Photo upload failed');
        }
    };

    return {
        photoUrl,
        setPhotoUrl,
        uploading: uploadMutation.isPending,
        handleFileSelected,
    };
}
