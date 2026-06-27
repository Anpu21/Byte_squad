import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsService } from '@/services/shifts.service';
import { queryKeys } from '@/lib/queryKeys';
import type { ICashMovementPayload } from '@/types';

/** Open/close/adjust drawer-session mutations — all refresh the current shift. */
export function useShiftMutations() {
    const queryClient = useQueryClient();
    const invalidate = () =>
        void queryClient.invalidateQueries({
            queryKey: queryKeys.shifts.all(),
        });

    const open = useMutation({
        mutationFn: (openingFloat: number) =>
            shiftsService.open(openingFloat),
        onSuccess: invalidate,
    });
    const close = useMutation({
        mutationFn: (input: { countedCash: number; notes?: string }) =>
            shiftsService.close(input.countedCash, input.notes),
        onSuccess: invalidate,
    });
    const recordMovement = useMutation({
        mutationFn: (input: ICashMovementPayload) =>
            shiftsService.recordCashMovement(input),
        onSuccess: invalidate,
    });

    return { open, close, recordMovement };
}
