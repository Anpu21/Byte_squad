import type { IGrn } from './grn.type';

/** Response shape of `GET /purchases/grns`. */
export interface IGrnsListResponse {
    rows: IGrn[];
    total: number;
    limit: number;
    offset: number;
}
