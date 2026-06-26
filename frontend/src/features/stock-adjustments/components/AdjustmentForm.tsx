import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { inventoryService } from '@/services/inventory.service'
import { userService } from '@/services/user.service'
import { posService } from '@/services/pos.service'
import { queryKeys } from '@/lib/queryKeys'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/constants/enums'
import { FRONTEND_ROUTES } from '@/constants/routes'
import { useStockAdjustmentCreate } from '../hooks/useStockAdjustmentCreate'
import { REASON_OPTIONS } from '../lib/reason'
import type { IStockAdjustmentReason } from '@/types'

const SELECT_CLASS =
  'w-full h-[38px] px-3 bg-surface border border-border-strong rounded-md text-[13px] text-text-1 outline-none transition-colors hover:border-text-3 focus:border-focus focus:ring-[3px] focus:ring-primary/30'

export function AdjustmentForm() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isAdmin = user?.role === UserRole.ADMIN
  const { submit, isSubmitting } = useStockAdjustmentCreate()

  const [productId, setProductId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [reason, setReason] = useState<IStockAdjustmentReason>('Stock_Take')
  const [physicalQuantity, setPhysicalQuantity] = useState('')
  const [notes, setNotes] = useState('')

  const productsQuery = useQuery({
    queryKey: queryKeys.product.all(),
    queryFn: inventoryService.getProducts,
  })

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches.all(),
    queryFn: userService.getBranches,
    enabled: isAdmin,
  })

  // Current on-hand for the picked product (scoped to the caller's branch by the
  // backend). Shown as a hint for managers; admins enter the count directly.
  const inventoryQuery = useQuery({
    queryKey: queryKeys.pos.productInventory(productId),
    queryFn: () => posService.getProductInventory(productId),
    enabled: Boolean(productId) && !isAdmin,
  })

  const onHand = inventoryQuery.data?.branchQty
  const physicalNum = Number(physicalQuantity)
  const difference =
    !isAdmin && onHand !== undefined && physicalQuantity !== ''
      ? Math.round((physicalNum - onHand) * 1000) / 1000
      : null

  const canSubmit =
    Boolean(productId) &&
    physicalQuantity !== '' &&
    (!isAdmin || Boolean(branchId))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    submit({
      productId,
      reason,
      physicalQuantity: physicalNum,
      notes: notes || undefined,
      branchId: isAdmin ? branchId : undefined,
    })
  }

  return (
    <Card className="p-5 max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-2 mb-1.5">
            Product
          </label>
          <select
            className={SELECT_CLASS}
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="" disabled>
              {productsQuery.isLoading ? 'Loading…' : 'Select a product'}
            </option>
            {(productsQuery.data ?? []).map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.barcode})
              </option>
            ))}
          </select>
        </div>

        {isAdmin && (
          <div>
            <label className="block text-xs font-medium text-text-2 mb-1.5">
              Branch
            </label>
            <select
              className={SELECT_CLASS}
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            >
              <option value="" disabled>
                {branchesQuery.isLoading ? 'Loading…' : 'Select a branch'}
              </option>
              {(branchesQuery.data ?? [])
                .filter((b) => b.isActive)
                .map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-text-2 mb-1.5">
            Reason
          </label>
          <select
            className={SELECT_CLASS}
            value={reason}
            onChange={(e) =>
              setReason(e.target.value as IStockAdjustmentReason)
            }
          >
            {REASON_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Input
            type="number"
            step="0.001"
            min="0"
            label="Counted (physical) quantity"
            placeholder="0"
            value={physicalQuantity}
            onChange={(e) => setPhysicalQuantity(e.target.value)}
          />
          {!isAdmin && onHand !== undefined && (
            <p className="mt-1.5 text-xs text-text-3">
              On-hand now: <span className="num">{onHand}</span>
              {difference !== null && (
                <>
                  {' · '}
                  <span
                    className={
                      difference < 0 ? 'text-danger' : 'text-accent-text'
                    }
                  >
                    {difference < 0 ? '' : '+'}
                    {difference}
                  </span>
                </>
              )}
            </p>
          )}
        </div>

        <Input
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(FRONTEND_ROUTES.STOCK_ADJUSTMENTS)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Record adjustment'}
          </Button>
        </div>
      </form>
    </Card>
  )
}
