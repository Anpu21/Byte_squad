import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { hrService } from '@/services/hr.service';
import type { IShipment } from '@/types';
import { useShipmentActions } from '@/features/shipment-tracking/hooks/useShipmentActions';

type Mode = 'assign' | 'checkpoint' | 'return' | 'cancel';

const TITLES: Record<Mode, string> = {
    assign: 'Assign courier',
    checkpoint: 'Add tracking checkpoint',
    return: 'Return shipment',
    cancel: 'Cancel shipment',
};

const FIELD =
    'w-full bg-surface border border-border rounded-md px-3 py-2 text-sm text-text-1 focus:outline-none focus:ring-[3px] focus:ring-focus/25';

interface Props {
    mode: Mode;
    shipment: IShipment;
    actions: ReturnType<typeof useShipmentActions>;
    onClose: () => void;
}

export function ShipmentActionModal({ mode, shipment, actions, onClose }: Props) {
    return (
        <Modal
            isOpen
            onClose={onClose}
            title={TITLES[mode]}
            maxWidth="md"
            closeOnBackdrop={false}
        >
            {mode === 'assign' ? (
                <AssignBody shipment={shipment} actions={actions} onClose={onClose} />
            ) : mode === 'checkpoint' ? (
                <CheckpointBody actions={actions} onClose={onClose} />
            ) : (
                <ReasonBody mode={mode} actions={actions} onClose={onClose} />
            )}
        </Modal>
    );
}

function AssignBody({
    shipment,
    actions,
    onClose,
}: {
    shipment: IShipment;
    actions: ReturnType<typeof useShipmentActions>;
    onClose: () => void;
}) {
    const { data, isLoading } = useQuery({
        queryKey: ['hr', 'employees', 'for-shipment', shipment.sourceBranchId],
        queryFn: () =>
            hrService.listEmployees({
                branchId: shipment.sourceBranchId,
                status: 'Active',
                limit: 100,
            }),
    });
    const employees = data?.rows ?? [];

    if (isLoading) {
        return <p className="text-sm text-text-3">Loading couriers…</p>;
    }
    if (employees.length === 0) {
        return (
            <p className="text-sm text-text-3">
                No active staff at the source branch to assign.
            </p>
        );
    }
    return (
        <ul className="space-y-1.5 max-h-[50vh] overflow-y-auto">
            {employees.map((emp) => (
                <li key={emp.id}>
                    <button
                        type="button"
                        disabled={actions.isPending}
                        onClick={() =>
                            actions.assignCourier.mutate(emp.id, { onSuccess: onClose })
                        }
                        className="w-full text-left px-3 py-2 rounded-md border border-border hover:bg-surface-2 transition-colors disabled:opacity-50 flex items-center justify-between gap-2"
                    >
                        <span className="min-w-0">
                            <span className="text-sm font-medium text-text-1">
                                {emp.fullName}
                            </span>
                            <span className="text-xs text-text-3 ml-2">{emp.role}</span>
                        </span>
                        {shipment.courierEmployeeId === emp.id && (
                            <span className="text-[11px] text-accent-text shrink-0">
                                current
                            </span>
                        )}
                    </button>
                </li>
            ))}
        </ul>
    );
}

function CheckpointBody({
    actions,
    onClose,
}: {
    actions: ReturnType<typeof useShipmentActions>;
    onClose: () => void;
}) {
    const [location, setLocation] = useState('');
    const [note, setNote] = useState('');
    const valid = location.trim().length >= 2;

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                    Location
                </label>
                <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Passed Kandy junction"
                    className={FIELD}
                />
            </div>
            <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                    Note (optional)
                </label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={2}
                    className={FIELD}
                />
            </div>
            <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    size="sm"
                    disabled={!valid || actions.isPending}
                    onClick={() =>
                        actions.checkpoint.mutate(
                            { location: location.trim(), note: note.trim() || undefined },
                            { onSuccess: onClose },
                        )
                    }
                >
                    Add checkpoint
                </Button>
            </div>
        </div>
    );
}

function ReasonBody({
    mode,
    actions,
    onClose,
}: {
    mode: 'return' | 'cancel';
    actions: ReturnType<typeof useShipmentActions>;
    onClose: () => void;
}) {
    const [reason, setReason] = useState('');
    const valid = reason.trim().length >= 3;

    const submit = () => {
        const r = reason.trim();
        if (mode === 'return') {
            actions.returnShipment.mutate(r, { onSuccess: onClose });
        } else {
            actions.cancel.mutate(r, { onSuccess: onClose });
        }
    };

    return (
        <div className="space-y-3">
            <div>
                <label className="block text-xs font-medium text-text-2 mb-1">
                    Reason
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder={
                        mode === 'return'
                            ? 'Why is this shipment being returned?'
                            : 'Why is this shipment being cancelled?'
                    }
                    className={FIELD}
                />
            </div>
            <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={onClose}>
                    Back
                </Button>
                <Button
                    variant="danger"
                    size="sm"
                    disabled={!valid || actions.isPending}
                    onClick={submit}
                >
                    {mode === 'return' ? 'Return shipment' : 'Cancel shipment'}
                </Button>
            </div>
        </div>
    );
}
