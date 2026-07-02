import { LuSearch as Search } from 'react-icons/lu';
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import PageHeader from '@/components/ui/PageHeader'
import { useReturnWorkflow } from '@/features/returns/hooks/useReturnWorkflow'
import { ReturnEditor } from '@/features/returns/components/ReturnEditor'

export function ReturnNewPage() {
  const p = useReturnWorkflow()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="New return"
        subtitle="Look up a sale by invoice, then split returned items into good / bad"
      />

      <Card className="p-4 mb-4">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            p.search()
          }}
        >
          <div className="flex-1">
            <Input
              label="Invoice number"
              placeholder="e.g. INV-COL-2026-000123"
              value={p.invoiceInput}
              onChange={(e) => p.setInvoiceInput(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={p.isLooking}>
            <Search size={15} />
            {p.isLooking ? 'Searching…' : 'Find sale'}
          </Button>
        </form>
      </Card>

      {p.lookupError && (
        <div className="mb-4 px-4 py-2.5 rounded-md bg-danger-soft border border-danger/40 text-sm text-danger">
          No active sale was found for that invoice number.
        </div>
      )}

      {p.lookup && (
        <ReturnEditor
          lookup={p.lookup}
          lines={p.lines}
          drafts={p.drafts}
          setDraft={p.setDraft}
          reason={p.reason}
          setReason={p.setReason}
          refundPreview={p.refundPreview}
          canSubmit={p.canSubmit}
          submit={p.submit}
          isSubmitting={p.isSubmitting}
          saleId={p.saleId}
          buildReturnLines={p.buildReturnLines}
          hasReturnLines={p.hasReturnLines}
        />
      )}
    </div>
  )
}
