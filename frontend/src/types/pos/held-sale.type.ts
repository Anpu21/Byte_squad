/**
 * A parked sale persisted server-side. The `snapshot` is opaque at this
 * transport layer — the POS feature owns its concrete cart shape and casts
 * when restoring. Stored display fields (label/itemCount/total) drive the
 * shelf without parsing the snapshot.
 */
export interface IHeldSale {
    id: string;
    label: string;
    itemCount: number;
    total: number;
    snapshot: unknown;
    /** Cashier who parked it — supervisor-visible within the branch. */
    heldByName: string | null;
    createdAt: string;
}

/** Body for `POST /pos/held-sales`. */
export interface IHeldSalePayload {
    label: string;
    itemCount: number;
    total: number;
    snapshot: unknown;
}
