import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import { FRONTEND_ROUTES } from "@/constants/routes";
import { cn, formatCurrency } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/format-time-ago";
import type { CustomerType, ICustomerSummaryRow } from "@/types";

const TYPE_BADGE: Record<CustomerType, string> = {
  registered: "bg-info-soft text-info",
  "walk-in": "bg-surface-2 text-text-2",
  khata: "bg-warning-soft text-warning",
};
const TYPE_LABEL: Record<CustomerType, string> = {
  registered: "Registered",
  "walk-in": "Walk-in",
  khata: "Khata",
};

interface CustomersTableProps {
  rows: ICustomerSummaryRow[];
  isLoading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function CustomersTable({
  rows,
  isLoading,
  page,
  pageSize,
  total,
  onPageChange,
}: CustomersTableProps) {
  const navigate = useNavigate();
  const openCustomer = (row: ICustomerSummaryRow) =>
    navigate(
      FRONTEND_ROUTES.CUSTOMER_DETAIL.replace(
        ":key",
        encodeURIComponent(row.customerKey),
      ),
    );

  const columns: DataTableColumn<ICustomerSummaryRow>[] = [
    {
      key: "name",
      header: "Customer",
      render: (row) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-text-1">
            {row.displayName}
          </div>
          <div className="truncate text-[12px] text-text-3">
            {row.phone ?? row.email ?? "—"}
          </div>
        </div>
      ),
    },
    {
      key: "types",
      header: "Type",
      render: (row) => (
        <span className="flex flex-wrap gap-1">
          {row.types.map((t) => (
            <span
              key={t}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                TYPE_BADGE[t],
              )}
            >
              {TYPE_LABEL[t]}
            </span>
          ))}
        </span>
      ),
    },
    {
      key: "branch",
      header: "Home branch",
      render: (row) => row.homeBranchName ?? "—",
    },
    {
      key: "loyalty",
      header: "Points",
      align: "right",
      numeric: true,
      render: (row) => row.loyaltyPoints.toLocaleString(),
    },
    {
      key: "credit",
      header: "Balance",
      align: "right",
      numeric: true,
      render: (row) => (
        <span className={row.creditBalance > 0 ? "text-warning" : undefined}>
          {formatCurrency(row.creditBalance)}
        </span>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      numeric: true,
      render: (row) => row.ordersCount.toLocaleString(),
    },
    {
      key: "spend",
      header: "Lifetime",
      align: "right",
      numeric: true,
      render: (row) => formatCurrency(row.lifetimeSpend),
    },
    {
      key: "last",
      header: "Last seen",
      align: "right",
      render: (row) => (row.lastSeenAt ? formatTimeAgo(row.lastSeenAt) : "—"),
    },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (row) => (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
            row.status === "blocked"
              ? "bg-danger-soft text-danger"
              : "bg-accent-soft text-accent-text",
          )}
        >
          {row.status === "blocked" ? "Blocked" : "Active"}
        </span>
      ),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <DataTable<ICustomerSummaryRow>
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.customerKey}
        onRowClick={openCustomer}
        getRowLabel={(row) => `Open ${row.displayName}`}
        isLoading={isLoading}
        stickyHeader
        zebra
        empty={
          <EmptyState
            title="No customers found"
            description="Try adjusting the search or filters."
          />
        }
        footer={
          <Pagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
            unit="customers"
          />
        }
      />
    </Card>
  );
}
