import type { ReactElement } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ICustomerSummaryRow } from "@/types";
import { CustomersTable } from "../CustomersTable";

function renderInRouter(ui: ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

const rows: ICustomerSummaryRow[] = [
  {
    customerKey: "94771234567",
    displayName: "Ayesha Perera",
    phone: "+94771234567",
    email: "ayesha@example.com",
    types: ["registered", "khata"],
    homeBranchId: "b1",
    homeBranchName: "Main Branch",
    loyaltyPoints: 120,
    creditBalance: 4389,
    ordersCount: 3,
    lifetimeSpend: 7980,
    lastSeenAt: "2026-06-19T03:56:13.240Z",
    tags: [],
    status: "active",
  },
];

describe("CustomersTable", () => {
  it("renders a stitched customer with its type badges and home branch", () => {
    renderInRouter(
      <CustomersTable
        rows={rows}
        isLoading={false}
        page={1}
        pageSize={10}
        total={1}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Ayesha Perera")).toBeInTheDocument();
    expect(screen.getByText("Registered")).toBeInTheDocument();
    expect(screen.getByText("Khata")).toBeInTheDocument();
    expect(screen.getByText("Main Branch")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("shows an empty state when there are no customers", () => {
    renderInRouter(
      <CustomersTable
        rows={[]}
        isLoading={false}
        page={1}
        pageSize={10}
        total={0}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("No customers found")).toBeInTheDocument();
  });
});
