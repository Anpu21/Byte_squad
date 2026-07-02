import { LuStar as Star } from "react-icons/lu";
import Card from "@/components/ui/Card";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import type { BranchAnalyticsProductMetric } from "@/types";
import type { ProductBranchInfo, ProductTableRow } from "./products-data";

interface ProductComparisonTableProps {
  rows: ProductTableRow[];
  branches: ProductBranchInfo[];
  metric: BranchAnalyticsProductMetric;
  branchColorFor: (branchId: string) => string;
  format: (value: number) => string;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

/**
 * Viz (d) — the accurate product × branch matrix. One numeric column per
 * selected branch (the leader cell bold), a total, and the leader's margin over
 * the runner-up. Server-paginated: `rows` is already the page; the pager is fed
 * `page`/`total` from the hook (not DataTable's client paginator).
 */
export function ProductComparisonTable({
  rows,
  branches,
  metric,
  branchColorFor,
  format,
  page,
  pageSize,
  total,
  onPageChange,
  isLoading,
}: ProductComparisonTableProps) {
  const noun = metric === "quantity" ? "units" : "revenue";

  const branchColumns: DataTableColumn<ProductTableRow>[] = branches.map(
    (branch) => ({
      key: branch.branchId,
      align: "right",
      numeric: true,
      header: (
        <span className="inline-flex items-center gap-1.5">
          <span
            className="size-2 flex-none rounded-full"
            style={{ backgroundColor: branchColorFor(branch.branchId) }}
            aria-hidden="true"
          />
          {branch.branchName}
        </span>
      ),
      render: (row) => {
        const cell = row.perBranch.find((c) => c.branchId === branch.branchId);
        if (!cell) return <span className="text-text-3">—</span>;
        return (
          <span
            className={
              cell.isLeader ? "font-semibold text-text-1" : "text-text-2"
            }
          >
            {format(cell.value)}
          </span>
        );
      },
    }),
  );

  const columns: DataTableColumn<ProductTableRow>[] = [
    {
      key: "product",
      header: "Product",
      className: "font-medium text-text-1",
      render: (row) => row.productName,
    },
    ...branchColumns,
    {
      key: "total",
      header: metric === "quantity" ? "Total qty" : "Total",
      align: "right",
      numeric: true,
      render: (row) => (
        <span className="font-semibold text-text-1">{format(row.total)}</span>
      ),
    },
    {
      key: "lead",
      header: "Lead vs 2nd",
      align: "right",
      numeric: true,
      render: (row) =>
        row.leaderBranchId && row.leadGap > 0 ? (
          <span className="inline-flex items-center gap-1 text-accent-text">
            <Star size={11} fill="currentColor" aria-hidden="true" />
            {(row.leadGap * 100).toFixed(0)}%
          </span>
        ) : (
          <span className="text-text-3">—</span>
        ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border bg-surface-2/40 px-5 py-3.5">
        <p className="text-[13px] font-semibold tracking-tight text-text-1">
          Product × branch breakdown
        </p>
        <p className="mt-0.5 text-[11px] text-text-3">
          Accurate {noun} for every product in every selected branch — the
          leading branch is bold.
        </p>
      </div>
      <DataTable<ProductTableRow>
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.productId}
        isLoading={isLoading}
        stickyHeader
        zebra
        empty={<EmptyState title="No products match this search" />}
        footer={
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            unit="products"
          />
        }
      />
    </Card>
  );
}
