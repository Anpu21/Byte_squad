import EmptyState from "@/components/ui/EmptyState";
import { useCustomerAnalytics } from "./hooks/useCustomerAnalytics";
import { CustomersViewTabs } from "./components/CustomersViewTabs";
import { CustomerInsightsKpis } from "./components/CustomerInsightsKpis";
import { CustomerSegmentBreakdown } from "./components/CustomerSegmentBreakdown";
import { CustomerLtvLeaderboard } from "./components/CustomerLtvLeaderboard";

/**
 * Customer analytics — RFM-lite segments, retention buckets, and the LTV
 * leaderboard across the stitched customer base (branch-scoped for managers).
 */
export function CustomerInsightsPage() {
  const { data, isLoading, isError } = useCustomerAnalytics();

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-text-1">
          Customers
        </h1>
        <p className="mt-1 text-[13px] text-text-3">
          Lifetime value, retention, and RFM segments across your customer base.
        </p>
      </header>

      <CustomersViewTabs />

      {isLoading && (
        <div className="py-16 text-center text-[13px] text-text-3">
          Loading insights…
        </div>
      )}
      {isError && (
        <EmptyState
          title="Couldn’t load analytics"
          description="Please try again in a moment."
        />
      )}

      {data && (
        <div className="space-y-5">
          <CustomerInsightsKpis analytics={data} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="xl:col-span-2">
              <CustomerSegmentBreakdown
                segments={data.segments}
                totalCustomers={data.totalCustomers}
              />
            </div>
            <div className="xl:col-span-3">
              <CustomerLtvLeaderboard leaders={data.topCustomers} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
