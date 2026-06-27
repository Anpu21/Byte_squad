import type { CustomerOrderStatus } from '@/types';

/**
 * The customer-visible pickup lifecycle. The backend models three happy states
 * (pending → accepted → completed); we render them as a three-step timeline.
 * A distinct "accepted vs ready" split would need a backend status, so it is
 * intentionally out of scope here.
 */
export const TIMELINE_STEPS = ['Placed', 'Ready for pickup', 'Picked up'] as const;

export interface OrderTimelineState {
    /** `happy` renders the stepper; `terminal` renders a single status chip. */
    phase: 'happy' | 'terminal';
    /**
     * Current step index on the happy path: a step is *done* when its index is
     * below `step` and *current* when equal. `completed` lands past the last
     * index, so every step reads as done.
     */
    step: number;
}

/**
 * Map an order status onto the three-step pickup timeline. Negative outcomes
 * (cancelled / rejected / expired / not collected) fall off the happy path and
 * are surfaced as a terminal chip instead.
 */
export function orderTimelineStep(
    status: CustomerOrderStatus,
): OrderTimelineState {
    switch (status) {
        case 'pending':
            return { phase: 'happy', step: 1 };
        case 'accepted':
            return { phase: 'happy', step: 2 };
        case 'completed':
            return { phase: 'happy', step: 3 };
        default:
            return { phase: 'terminal', step: 0 };
    }
}
