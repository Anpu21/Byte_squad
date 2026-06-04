import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hrService } from '@/services/hr.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IEmployee } from '@/types';

interface UploadEmployeePhotoArgs {
    id: string;
    file: File;
}

/**
 * Wraps `POST /hr/employees/:id/photo`. Multipart upload — the
 * BE handles Cloudinary storage and returns the updated employee
 * with `photoUrl` set. Invalidates the list so the avatar in the
 * table refreshes too.
 */
export function useUploadEmployeePhoto() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, file }: UploadEmployeePhotoArgs): Promise<IEmployee> =>
            hrService.uploadEmployeePhoto(id, file),
        onSuccess: (updated) => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.hr.all() });
            queryClient.setQueryData(
                queryKeys.hr.employee(updated.id),
                updated,
            );
        },
    });
}
