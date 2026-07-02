import { useNavigate } from "react-router-dom";
import Card from "@/components/ui/Card";
import DataTable, { type DataTableColumn } from "@/components/ui/DataTable";
import EmptyState from "@/components/ui/EmptyState";
import { FRONTEND_ROUTES } from "@/constants/routes";
import { formatCurrency } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/format-time-ago";
import type { ICustomerAnalyticsLeader } from "@/types";

export function CustomerLtvLeaderboard({
  leaders,
}: {
  leaders: ICustomerAnalyticsLeader[];
}) {
  const navigate = useNavigate();
  const open = (r: ICustomerAnalyticsLeader) =>
    navigate(
      FRONTEND_ROUTES.CUSTOMER_DETAIL.replace(
        ":key",
        encodeURIComponent(r.customerKey),
      ),
    );

  const columns: DataTableColumn<ICustomerAnalyticsLeader>[] = [
    {
      key: "rank",
      header: "#",
      render: (_r, i) => <span className="text-text-3">{i + 1}</span>,
    },
    {
      key: "name",
      header: "Customer",
      render: (r) => (
        <span className="font-medium text-text-1">{r.displayName}</span>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      numeric: true,
      render: (r) => r.ordersCount.toLocaleString(),
    },
    {
      key: "ltv",
      header: "Lifetime value",
      align: "right",
      numeric: true,
      render: (r) => (
        <span className="font-semibold text-text-1">
          {formatCurrency(r.lifetimeSpend)}
        </span>
      ),
    },
    {
      key: "last",
      header: "Last seen",
      align: "right",
      render: (r) => (
        <span className="text-text-3">
          {r.lastSeenAt ? formatTimeAgo(r.lastSeenAt) : "—"}
        </span>
      ),
    },
  ];

  return (
    <Card className="p-5">
      <h3 className="mb-4 text-[13px] font-semibold text-text-1">
        Top customers by lifetime value
      </h3>
      {leaders.length === 0 ? (
        <EmptyState title="No purchases yet" className="py-6" />
      ) : (
        <DataTable<ICustomerAnalyticsLeader>
          columns={columns}
          rows={leaders}
          getRowKey={(r) => r.customerKey}
          onRowClick={open}
          getRowLabel={(r) => `Open ${r.displayName}`}
          zebra
        />
      )}
    </Card>
  );
}
