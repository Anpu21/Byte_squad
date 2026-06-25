import PageHeader from '@/components/ui/PageHeader'
import { AdjustmentForm } from '@/features/stock-adjustments/components/AdjustmentForm'

export function StockAdjustmentNewPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="New stock adjustment"
        subtitle="Record a counted quantity — the difference is applied to on-hand stock"
      />
      <AdjustmentForm />
    </div>
  )
}
