import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type {
  IBranchAnalyticsComparisonResponse,
  IBranchAnalyticsProductsResponse,
} from "@/types";
import { ProductsView } from "../ProductsView";
import { useProductComparison } from "../../../hooks/useProductComparison";

vi.mock("../../../hooks/useProductComparison", () => ({
  useProductComparison: vi.fn(),
}));

// Recharts' ResponsiveContainer needs ResizeObserver, which jsdom lacks. The
// SVGs stay zero-sized, but every card header / legend / table cell we assert on
// is plain DOM.
beforeAll(() => {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver =
    ResizeObserverStub as unknown as typeof ResizeObserver;
});

const comparison = {
  startDate: "2026-06-01T00:00:00.000Z",
  endDate: "2026-06-03T23:59:59.999Z",
  branches: [
    { branchId: "A", branchName: "Alpha" },
    { branchId: "B", branchName: "Beta" },
  ],
} as unknown as IBranchAnalyticsComparisonResponse;

const branchColors = { A: "var(--primary)", B: "var(--accent)" };

const data: IBranchAnalyticsProductsResponse = {
  items: [
    {
      productId: "p1",
      productName: "Bananas",
      totalRevenue: 300,
      totalQuantity: 30,
      perBranch: [
        { branchId: "A", revenue: 200, quantity: 20 },
        { branchId: "B", revenue: 100, quantity: 10 },
      ],
    },
    {
      productId: "p2",
      productName: "Milk",
      totalRevenue: 150,
      totalQuantity: 15,
      perBranch: [
        { branchId: "A", revenue: 150, quantity: 15 },
        { branchId: "B", revenue: 0, quantity: 0 },
      ],
    },
  ],
  total: 2,
  page: 1,
  limit: 10,
  totalPages: 1,
  branches: [
    { branchId: "A", branchName: "Alpha" },
    { branchId: "B", branchName: "Beta" },
  ],
  startDate: comparison.startDate,
  endDate: comparison.endDate,
  sort: "revenue",
};

function mockHook(over: Partial<ReturnType<typeof useProductComparison>> = {}) {
  vi.mocked(useProductComparison).mockReturnValue({
    data,
    isLoading: false,
    isRefreshing: false,
    searchInput: "",
    setSearch: vi.fn(),
    sort: "revenue",
    setSort: vi.fn(),
    page: 1,
    setPage: vi.fn(),
    ...over,
  });
}

function renderView() {
  return render(
    <ProductsView comparison={comparison} branchColors={branchColors} />,
  );
}

describe("ProductsView", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the metric toggle and product search", () => {
    mockHook();
    renderView();
    expect(screen.getByRole("button", { name: "Revenue" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Quantity" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search products")).toBeInTheDocument();
  });

  it("renders all four visualizations", () => {
    mockHook();
    renderView();
    expect(screen.getByText("Revenue by branch")).toBeInTheDocument();
    expect(screen.getByText("Product mix per branch")).toBeInTheDocument();
    expect(screen.getByText("Single-product drill-down")).toBeInTheDocument();
    expect(screen.getByText("Product × branch breakdown")).toBeInTheDocument();
  });

  it("renders the key-differences strip and product names", () => {
    mockHook();
    renderView();
    expect(screen.getByText("Widest branch gap")).toBeInTheDocument();
    expect(screen.getByText("Most product wins")).toBeInTheDocument();
    expect(screen.getByText("Uneven coverage")).toBeInTheDocument();
    // A product outside a branch's old top-5 now shows everywhere (table + more).
    expect(screen.getAllByText("Bananas").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Milk").length).toBeGreaterThan(0);
  });

  it("shows an empty state when there are no products", () => {
    mockHook({ data: { ...data, items: [], total: 0 } });
    renderView();
    expect(
      screen.getByText("No product sales to compare"),
    ).toBeInTheDocument();
  });

  it("shows a loading state on first load", () => {
    mockHook({ data: undefined, isLoading: true });
    renderView();
    expect(screen.getByText("Loading products…")).toBeInTheDocument();
  });
});
