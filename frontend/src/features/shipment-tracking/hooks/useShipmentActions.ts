import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { shipmentsService } from '@/services/shipments.service';
import { queryKeys } from '@/lib/queryKeys';
import type { IShipmentCheckpointPayload } from '@/types';

function describeError(err: unknown, fallback: string): string {
    if (
        axios.isAxiosError(err) &&
        typeof err.response?.data?.message === 'string'
    ) {
        return err.response.data.message;
    }
    return fallback;
}

/**
 * All shipment lifecycle mutations for a given shipment, each wired to a
 * toast + an invalidation of the whole `shipments` family so the detail and
 * list views refresh together.
 */
export function useShipmentActions(id: string) {
    const qc = useQueryClient();
    const invalidate = () =>
        void qc.invalidateQueries({ queryKey: queryKeys.shipments.all() });

    const dispatch = useMutation({
        mutationFn: () => shipmentsService.dispatch(id),
        onSuccess: () => {
            invalidate();
            toast.success('Shipment dispatched');
        },
        onError: (e) => toast.error(describeError(e, 'Could not dispatch')),
    });

    const outForDelivery = useMutation({
        mutationFn: () => shipmentsService.outForDelivery(id),
        onSuccess: () => {
            invalidate();
            toast.success('Out for delivery');
        },
        onError: (e) => toast.error(describeError(e, 'Could not update')),
    });

    const deliver = useMutation({
        mutationFn: () => shipmentsService.deliver(id),
        onSuccess: () => {
            invalidate();
            toast.success('Delivered');
        },
        onError: (e) => toast.error(describeError(e, 'Could not mark delivered')),
    });

    const checkpoint = useMutation({
        mutationFn: (payload: IShipmentCheckpointPayload) =>
            shipmentsService.checkpoint(id, payload),
        onSuccess: () => {
            invalidate();
            toast.success('Checkpoint added');
        },
        onError: (e) => toast.error(describeError(e, 'Could not add checkpoint')),
    });

    const returnShipment = useMutation({
        mutationFn: (reason: string) =>
            shipmentsService.returnShipment(id, reason),
        onSuccess: () => {
            invalidate();
            toast.success('Shipment returned');
        },
        onError: (e) => toast.error(describeError(e, 'Could not return')),
    });

    const cancel = useMutation({
        mutationFn: (reason: string) => shipmentsService.cancel(id, reason),
        onSuccess: () => {
            invalidate();
            toast.success('Shipment cancelled');
        },
        onError: (e) => toast.error(describeError(e, 'Could not cancel')),
    });

    const assignCourier = useMutation({
        mutationFn: (courierEmployeeId: string) =>
            shipmentsService.assignCourier(id, { courierEmployeeId }),
        onSuccess: () => {
            invalidate();
            toast.success('Courier assigned');
        },
        onError: (e) => toast.error(describeError(e, 'Could not assign courier')),
    });

    const isPending =
        dispatch.isPending ||
        outForDelivery.isPending ||
        deliver.isPending ||
        checkpoint.isPending ||
        returnShipment.isPending ||
        cancel.isPending ||
        assignCourier.isPending;

    return {
        dispatch,
        outForDelivery,
        deliver,
        checkpoint,
        returnShipment,
        cancel,
        assignCourier,
        isPending,
    };
}
