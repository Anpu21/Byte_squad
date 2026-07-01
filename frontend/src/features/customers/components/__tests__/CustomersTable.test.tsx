import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ICustomerSummaryRow } from "@/types";
import { CustomersTable } from "../CustomersTable";

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
    render(
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
    render(
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
