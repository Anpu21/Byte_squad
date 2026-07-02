import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/format-time-ago";
import type { ICustomerRecentOrder, ICustomerRecentSale } from "@/types";

export function CustomerRecentActivity({
  sales,
  orders,
}: {
  sales: ICustomerRecentSale[];
  orders: ICustomerRecentOrder[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="p-5">
        <h3 className="mb-3 text-[13px] font-semibold text-text-1">
          Recent sales
        </h3>
        {sales.length === 0 ? (
          <EmptyState title="No sales yet" className="py-6" />
        ) : (
          <ul className="divide-y divide-border">
            {sales.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 py-2.5 text-[13px]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-text-1">
                    {s.invoiceNumber}
                  </span>
                  <span className="text-[11px] text-text-3">
                    {s.branchName ?? "—"} · {formatTimeAgo(s.createdAt)}
                  </span>
                </span>
                <span className="mono font-semibold text-text-1">
                  {formatCurrency(s.total)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h3 className="mb-3 text-[13px] font-semibold text-text-1">
          Recent pickup orders
        </h3>
        {orders.length === 0 ? (
          <EmptyState title="No pickup orders" className="py-6" />
        ) : (
          <ul className="divide-y divide-border">
            {orders.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 py-2.5 text-[13px]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-text-1">
                    {o.orderCode}
                  </span>
                  <span className="text-[11px] text-text-3">
                    {o.status} · {formatTimeAgo(o.createdAt)}
                  </span>
                </span>
                <span className="mono font-semibold text-text-1">
                  {formatCurrency(o.finalTotal)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
