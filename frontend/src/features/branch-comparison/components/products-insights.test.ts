import { describe, it, expect } from "vitest";
import type { IBranchAnalyticsProductRow } from "@/types";
import { buildProductTableRows, type ProductBranchInfo } from "./products-data";
import { buildProductInsights } from "./products-insights";

const branches: ProductBranchInfo[] = [
  { branchId: "A", branchName: "Alpha" },
  { branchId: "B", branchName: "Beta" },
];

const bananas: IBranchAnalyticsProductRow = {
  productId: "p1",
  productName: "Bananas",
  totalRevenue: 300,
  totalQuantity: 30,
  perBranch: [
    { branchId: "A", revenue: 200, quantity: 20 },
    { branchId: "B", revenue: 100, quantity: 10 },
  ],
};
const milk: IBranchAnalyticsProductRow = {
  productId: "p2",
  productName: "Milk",
  totalRevenue: 150,
  totalQuantity: 15,
  perBranch: [
    { branchId: "A", revenue: 150, quantity: 15 },
    { branchId: "B", revenue: 0, quantity: 0 },
  ],
};

const fmt = (n: number) => `$${n}`;

describe("buildProductInsights", () => {
  it("returns nothing when there are no rows", () => {
    expect(buildProductInsights([], branches, fmt)).toEqual([]);
  });

  it("surfaces widest gap, most wins, and uneven coverage", () => {
    const rows = buildProductTableRows([bananas, milk], branches, "revenue");
    const insights = buildProductInsights(rows, branches, fmt);
    const byKey = Object.fromEntries(insights.map((i) => [i.key, i]));

    // Milk's gap (150-0=150) beats Bananas' (200-100=100).
    expect(byKey.gap.value).toBe("Milk");
    expect(byKey.gap.note).toContain("Alpha leads by $150");

    // Alpha leads both products.
    expect(byKey.wins.value).toBe("Alpha");
    expect(byKey.wins.note).toBe("Leads 2 of 2 products on this page");

    // Milk is sold at A but absent at B → one uneven product.
    expect(byKey.uneven.value).toBe("1 product");
    expect(byKey.uneven.accent).toBe("info");
  });

  it("reports even coverage when every branch sells every product", () => {
    const rows = buildProductTableRows([bananas], branches, "revenue");
    const uneven = buildProductInsights(rows, branches, fmt).find(
      (i) => i.key === "uneven",
    );
    expect(uneven?.value).toBe("0 products");
    expect(uneven?.accent).toBe("primary");
  });
});
