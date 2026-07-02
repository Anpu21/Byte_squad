import { describe, it, expect } from "vitest";
import { CHART_COLORS } from "@/components/charts/chart-palette";
import type { IBranchAnalyticsProductRow } from "@/types";
import {
  buildGroupedBarChart,
  buildProductColors,
  buildProductMixByBranch,
  buildProductTableRows,
  buildSingleProductSlices,
  metricOf,
  totalOf,
  type ProductBranchInfo,
} from "./products-data";

const branches: ProductBranchInfo[] = [
  { branchId: "A", branchName: "Alpha" },
  { branchId: "B", branchName: "Beta" },
];

function row(over: Partial<IBranchAnalyticsProductRow>): IBranchAnalyticsProductRow {
  return {
    productId: "p",
    productName: "Product",
    totalRevenue: 0,
    totalQuantity: 0,
    perBranch: [
      { branchId: "A", revenue: 0, quantity: 0 },
      { branchId: "B", revenue: 0, quantity: 0 },
    ],
    ...over,
  };
}

const items: IBranchAnalyticsProductRow[] = [
  row({
    productId: "p1",
    productName: "Bananas",
    totalRevenue: 300,
    totalQuantity: 30,
    perBranch: [
      { branchId: "A", revenue: 200, quantity: 20 },
      { branchId: "B", revenue: 100, quantity: 10 },
    ],
  }),
  row({
    productId: "p2",
    productName: "Milk",
    totalRevenue: 150,
    totalQuantity: 15,
    perBranch: [
      { branchId: "A", revenue: 150, quantity: 15 },
      { branchId: "B", revenue: 0, quantity: 0 }, // real zero-fill from the API
    ],
  }),
];

const colorFor = (id: string) => `c-${id}`;
const branchColorFor = (id: string) => `bc-${id}`;

describe("metricOf / totalOf", () => {
  it("selects revenue or quantity", () => {
    const cell = { revenue: 42, quantity: 7 };
    expect(metricOf(cell, "revenue")).toBe(42);
    expect(metricOf(cell, "quantity")).toBe(7);
    expect(totalOf(items[0], "revenue")).toBe(300);
    expect(totalOf(items[0], "quantity")).toBe(30);
  });
});

describe("buildProductColors", () => {
  it("assigns a stable palette colour per product and wraps mod-6", () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      row({ productId: `x${i}`, productName: `X${i}` }),
    );
    const colors = buildProductColors(many);
    expect(colors.x0).toBe(CHART_COLORS[0]);
    expect(colors.x1).toBe(CHART_COLORS[1]);
    // 7th product wraps back to the first colour.
    expect(colors.x6).toBe(CHART_COLORS[0]);
  });
});

describe("buildProductMixByBranch", () => {
  it("keeps only sold products, sorted desc, coloured by product", () => {
    const slices = buildProductMixByBranch(items, branches[0], "revenue", colorFor);
    expect(slices).toEqual([
      { name: "Bananas", value: 200, color: "c-p1" },
      { name: "Milk", value: 150, color: "c-p2" },
    ]);
  });

  it("drops a product with zero at that branch", () => {
    const slices = buildProductMixByBranch(items, branches[1], "revenue", colorFor);
    expect(slices).toEqual([{ name: "Bananas", value: 100, color: "c-p1" }]);
  });

  it("rolls the tail past 8 products into a muted Other slice", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      row({
        productId: `x${i}`,
        productName: `X${i}`,
        perBranch: [
          { branchId: "A", revenue: 100 - i, quantity: 0 },
          { branchId: "B", revenue: 0, quantity: 0 },
        ],
      }),
    );
    const slices = buildProductMixByBranch(many, branches[0], "revenue", colorFor);
    expect(slices).toHaveLength(9); // 8 named + Other
    const other = slices[8];
    expect(other.name).toBe("Other (2)");
    expect(other.color).toBe("var(--text-3)");
    expect(other.value).toBe((100 - 8) + (100 - 9)); // x8 + x9
  });
});

describe("buildGroupedBarChart", () => {
  it("emits one row per product with a key per branch, and branch bars", () => {
    const chart = buildGroupedBarChart(items, branches, "revenue", branchColorFor);
    expect(chart.data[0]).toEqual({ name: "Bananas", A: 200, B: 100 });
    expect(chart.data[1]).toEqual({ name: "Milk", A: 150, B: 0 });
    expect(chart.bars).toEqual([
      { key: "A", label: "Alpha", color: "bc-A" },
      { key: "B", label: "Beta", color: "bc-B" },
    ]);
  });

  it("uses quantity when the metric is quantity", () => {
    const chart = buildGroupedBarChart(items, branches, "quantity", branchColorFor);
    expect(chart.data[0]).toEqual({ name: "Bananas", A: 20, B: 10 });
  });
});

describe("buildSingleProductSlices", () => {
  it("splits one product across branches, dropping zero branches", () => {
    const slices = buildSingleProductSlices(items[1], branches, "revenue", branchColorFor);
    expect(slices).toEqual([{ name: "Alpha", value: 150, color: "bc-A" }]);
  });
});

describe("buildProductTableRows", () => {
  it("marks the leader branch and the lead gap over the runner-up (revenue)", () => {
    const rows = buildProductTableRows(items, branches, "revenue");
    const bananas = rows[0];
    expect(bananas.leaderBranchId).toBe("A");
    expect(bananas.total).toBe(300);
    expect(bananas.leadGap).toBeCloseTo(0.5); // (200-100)/200
    expect(bananas.perBranch.find((c) => c.branchId === "A")?.isLeader).toBe(true);
    expect(bananas.perBranch.find((c) => c.branchId === "B")?.isLeader).toBe(false);

    const milk = rows[1];
    expect(milk.leaderBranchId).toBe("A");
    expect(milk.leadGap).toBeCloseTo(1); // (150-0)/150
  });

  it("uses quantity when the metric is quantity", () => {
    const rows = buildProductTableRows(items, branches, "quantity");
    expect(rows[0].total).toBe(30);
    expect(rows[0].leadGap).toBeCloseTo(0.5); // (20-10)/20
  });

  it("has no leader when every branch is zero", () => {
    const rows = buildProductTableRows([row({ productId: "z" })], branches, "revenue");
    expect(rows[0].leaderBranchId).toBeNull();
    expect(rows[0].leadGap).toBe(0);
  });
});
