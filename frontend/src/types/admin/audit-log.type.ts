/** One activity-log row from `GET /audit/logs`. */
export interface IAuditLog {
    id: string;
    userId: string | null;
    userRole: string | null;
    method: string;
    path: string;
    statusCode: number;
    durationMs: number;
    branchId: string | null;
    createdAt: string;
}

/** Response shape of `GET /audit/logs`. */
export interface IAuditLogsResponse {
    rows: IAuditLog[];
    total: number;
    limit: number;
    offset: number;
}
