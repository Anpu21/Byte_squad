import { LuSearch as Search } from "react-icons/lu";
import Input from "@/components/ui/Input";
import Segmented from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import type { IBranch } from "@/types";
import type {
  CustomerStatusFilter,
  CustomerTypeFilter,
} from "../hooks/useCustomersPage";

interface CustomersFiltersProps {
  isAdmin: boolean;
  branches: IBranch[];
  searchInput: string;
  setSearch: (value: string) => void;
  type: CustomerTypeFilter;
  setType: (value: CustomerTypeFilter) => void;
  status: CustomerStatusFilter;
  setStatus: (value: CustomerStatusFilter) => void;
  branchId: string;
  setBranchId: (value: string) => void;
}

const TYPE_OPTIONS: { label: string; value: CustomerTypeFilter }[] = [
  { label: "All", value: "all" },
  { label: "Registered", value: "registered" },
  { label: "Walk-in", value: "walk-in" },
  { label: "Khata", value: "khata" },
];

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  { label: "Active", value: "active" },
  { label: "Blocked", value: "blocked" },
];

export function CustomersFilters({
  isAdmin,
  branches,
  searchInput,
  setSearch,
  type,
  setType,
  status,
  setStatus,
  branchId,
  setBranchId,
}: CustomersFiltersProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="lg:w-72">
        <Input
          aria-label="Search customers"
          placeholder="Search name, phone, email…"
          value={searchInput}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search size={15} />}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <Segmented value={type} options={TYPE_OPTIONS} onChange={setType} />
        <Select
          aria-label="Filter by status"
          value={status}
          onChange={(v) => setStatus(v as CustomerStatusFilter)}
          options={STATUS_OPTIONS}
        />
        {isAdmin && (
          <Select
            aria-label="Filter by branch"
            value={branchId || "all"}
            onChange={(v) => setBranchId(v === "all" ? "" : v)}
            options={[
              { label: "All branches", value: "all" },
              ...branches.map((b) => ({ label: b.name, value: b.id })),
            ]}
          />
        )}
      </div>
    </div>
  );
}
