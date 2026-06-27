import { describe, it, expect } from 'vitest';
import { orderTimelineStep, TIMELINE_STEPS } from './order-timeline-step';

describe('orderTimelineStep', () => {
    it('has three happy-path steps', () => {
        expect(TIMELINE_STEPS).toEqual(['Placed', 'Ready for pickup', 'Picked up']);
    });

    it('places a pending order at "Placed done, Ready current"', () => {
        // step 1 → index 0 (Placed) is done, index 1 (Ready) is current.
        expect(orderTimelineStep('pending')).toEqual({ phase: 'happy', step: 1 });
    });

    it('places an accepted order at "Ready done, Pickup current"', () => {
        expect(orderTimelineStep('accepted')).toEqual({ phase: 'happy', step: 2 });
    });

    it('marks a completed order as fully done (past the last step)', () => {
        const { phase, step } = orderTimelineStep('completed');
        expect(phase).toBe('happy');
        expect(step).toBeGreaterThanOrEqual(TIMELINE_STEPS.length);
    });

    it('drops negative outcomes off the happy path to a terminal chip', () => {
        for (const status of [
            'cancelled',
            'rejected',
            'expired',
            'not_collected',
        ] as const) {
            expect(orderTimelineStep(status).phase).toBe('terminal');
        }
    });
});
