import {
  ShipmentStatus,
  SHIPMENT_TERMINAL_STATUSES,
} from '@common/enums/shipment-status.enum';
import { ShipmentEventType } from '@common/enums/shipment-event-type.enum';
import { eventsForStatus } from './shipment-seed-timeline';

describe('eventsForStatus', () => {
  it('maps every ShipmentStatus to a non-empty timeline that starts with CREATED', () => {
    for (const status of Object.values(ShipmentStatus)) {
      const events = eventsForStatus(status);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toBe(ShipmentEventType.CREATED);
    }
  });

  it('ends each terminal status on its own terminal event', () => {
    const terminalEvent: Record<string, ShipmentEventType> = {
      [ShipmentStatus.DELIVERED]: ShipmentEventType.DELIVERED,
      [ShipmentStatus.RETURNED]: ShipmentEventType.RETURNED,
      [ShipmentStatus.CANCELLED]: ShipmentEventType.CANCELLED,
    };
    for (const status of SHIPMENT_TERMINAL_STATUSES) {
      const events = eventsForStatus(status);
      expect(events[events.length - 1]).toBe(terminalEvent[status]);
    }
  });

  it('gives in-transit shipments a DISPATCHED + CHECKPOINT waypoint', () => {
    const events = eventsForStatus(ShipmentStatus.DISPATCHED);
    expect(events).toContain(ShipmentEventType.DISPATCHED);
    expect(events).toContain(ShipmentEventType.CHECKPOINT);
  });

  it('returns a fresh array so callers cannot mutate the shared table', () => {
    const before = eventsForStatus(ShipmentStatus.DELIVERED).length;
    const copy = eventsForStatus(ShipmentStatus.DELIVERED);
    copy.push(ShipmentEventType.CHECKPOINT);
    expect(eventsForStatus(ShipmentStatus.DELIVERED).length).toBe(before);
  });
});
