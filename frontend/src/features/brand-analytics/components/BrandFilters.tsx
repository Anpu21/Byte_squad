import Input from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface BranchOption {
  id: string
  name: string
}

interface BrandFiltersProps {
  startDate: string
  endDate: string
  branchId: string
  isAdmin: boolean
  branches: BranchOption[]
  onStartDate: (value: string) => void
  onEndDate: (value: string) => void
  onBranchId: (value: string) => void
}

export function BrandFilters({
  startDate,
  endDate,
  branchId,
  isAdmin,
  branches,
  onStartDate,
  onEndDate,
  onBranchId,
}: BrandFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-text-2 mb-1.5">
          From
        </label>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => onStartDate(e.target.value)}
          className="w-auto"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-text-2 mb-1.5">
          To
        </label>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => onEndDate(e.target.value)}
          className="w-auto"
        />
      </div>
      {isAdmin && (
        <div>
          <label className="block text-xs font-medium text-text-2 mb-1.5">
            Branch
          </label>
          <Select
            value={branchId}
            onChange={onBranchId}
            aria-label="Branch filter"
            options={[
              { label: 'All branches', value: '' },
              ...branches.map((b) => ({ label: b.name, value: b.id })),
            ]}
          />
        </div>
      )}
    </div>
  )
}
