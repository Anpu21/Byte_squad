import { useCustomersPage } from "./hooks/useCustomersPage";
import { CustomersFilters } from "./components/CustomersFilters";
import { CustomersTable } from "./components/CustomersTable";

/**
 * Unified customers directory — every customer stitched across registered
 * accounts, walk-in loyalty, and khata. Admin sees all branches; managers are
 * scoped to their own by the API.
 */
export function CustomersPage() {
  const p = useCustomersPage();

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-5">
        <h1 className="text-[22px] font-bold tracking-tight text-text-1">
          Customers
        </h1>
        <p className="mt-1 text-[13px] text-text-3">
          Registered accounts, walk-in loyalty members, and khata holders in one
          place — {p.total.toLocaleString()} total.
        </p>
      </header>

      <CustomersFilters
        isAdmin={p.isAdmin}
        branches={p.branches}
        searchInput={p.searchInput}
        setSearch={p.setSearch}
        type={p.type}
        setType={p.setType}
        status={p.status}
        setStatus={p.setStatus}
        branchId={p.branchId}
        setBranchId={p.setBranchId}
      />

      <CustomersTable
        rows={p.rows}
        isLoading={p.isLoading}
        page={p.page}
        pageSize={p.limit}
        total={p.total}
        onPageChange={p.setPage}
      />
    </div>
  );
}
