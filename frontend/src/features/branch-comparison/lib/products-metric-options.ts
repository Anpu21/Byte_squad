import type { BranchAnalyticsProductMetric } from "@/types";

// The global METRIC_OPTIONS has no "quantity"; the Products tab compares by
// revenue OR units sold, so it needs its own two-option toggle.
export const PRODUCT_METRIC_OPTIONS: {
  label: string;
  value: BranchAnalyticsProductMetric;
}[] = [
  { label: "Revenue", value: "revenue" },
  { label: "Quantity", value: "quantity" },
];
