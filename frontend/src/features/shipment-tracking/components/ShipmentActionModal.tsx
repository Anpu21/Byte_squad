import Modal from '@/components/ui/Modal';
import type { IShipment } from '@/types';
import { useShipmentActions } from '@/features/shipment-tracking/hooks/useShipmentActions';
import {
    AssignBody,
    CheckpointBody,
    ReasonBody,
} from './shipment-action-bodies';

type Mode = 'assign' | 'checkpoint' | 'return' | 'cancel';

const TITLES: Record<Mode, string> = {
    assign: 'Assign courier',
    checkpoint: 'Add tracking checkpoint',
    return: 'Return shipment',
    cancel: 'Cancel shipment',
};

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
