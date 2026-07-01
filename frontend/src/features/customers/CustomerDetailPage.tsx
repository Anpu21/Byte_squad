import { Link, useParams } from "react-router-dom";
import { LuArrowLeft as ArrowLeft } from "react-icons/lu";
import { FRONTEND_ROUTES } from "@/constants/routes";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import type { CustomerType } from "@/types";
import { useCustomerDetail } from "./hooks/useCustomerDetail";
import { CustomerKpiStrip } from "./components/CustomerKpiStrip";
import { CustomerIdentityCard } from "./components/CustomerIdentityCard";
import { CustomerManageCard } from "./components/CustomerManageCard";
import { CustomerRecentActivity } from "./components/CustomerRecentActivity";

const TYPE_LABEL: Record<CustomerType, string> = {
  registered: "Registered",
  "walk-in": "Walk-in",
  khata: "Khata",
};

export function CustomerDetailPage() {
  const { key = "" } = useParams();
  const { data, isLoading, isError } = useCustomerDetail(key);

  return (
    <div className="animate-in fade-in duration-500">
      <Link
        to={FRONTEND_ROUTES.CUSTOMERS}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-3 transition-colors hover:text-text-1"
      >
        <ArrowLeft size={15} /> Back to customers
      </Link>

      {isLoading && (
        <div className="py-16 text-center text-[13px] text-text-3">
          Loading customer…
        </div>
      )}
      {isError && (
        <EmptyState
          title="Customer not found"
          description="This customer may have been removed or is outside your branch."
        />
      )}

      {data && (
        <>
          <header className="mb-5 flex flex-wrap items-center gap-2.5">
            <h1 className="text-[22px] font-bold tracking-tight text-text-1">
              {data.displayName}
            </h1>
            {data.types.map((t) => (
              <span
                key={t}
                className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-text-2"
              >
                {TYPE_LABEL[t]}
              </span>
            ))}
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                data.status === "blocked"
                  ? "bg-danger-soft text-danger"
                  : "bg-accent-soft text-accent-text",
              )}
            >
              {data.status === "blocked" ? "Blocked" : "Active"}
            </span>
          </header>

          <div className="mb-5">
            <CustomerKpiStrip kpis={data.kpis} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-1">
              <CustomerIdentityCard profile={data} />
              <CustomerManageCard key={data.customerKey} profile={data} />
            </div>
            <div className="xl:col-span-2">
              <CustomerRecentActivity
                sales={data.recentSales}
                orders={data.recentOrders}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
