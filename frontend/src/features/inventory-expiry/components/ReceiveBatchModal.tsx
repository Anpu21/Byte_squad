import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { FIELD_SHELL, FIELD_BORDER } from '@/components/ui'
import { inventoryService } from '@/services/inventory.service'
import { userService } from '@/services/user.service'
import { queryKeys } from '@/lib/queryKeys'
import { UserRole } from '@/constants/enums'
import type { ICreateProductBatchPayload } from '@/types'

interface ReceiveBatchModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: ICreateProductBatchPayload) => void
  isSubmitting: boolean
  role?: UserRole
}

const SELECT_CLASS = `${FIELD_SHELL} ${FIELD_BORDER} w-full h-[38px] px-3`

export function ReceiveBatchModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  role,
}: ReceiveBatchModalProps) {
  const isAdmin = role === UserRole.ADMIN

  const [productId, setProductId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [batchNo, setBatchNo] = useState('')
  const [notes, setNotes] = useState('')

  const productsQuery = useQuery({
    queryKey: queryKeys.product.all(),
    queryFn: inventoryService.getProducts,
    enabled: isOpen,
  })

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches.all(),
    queryFn: userService.getBranches,
    enabled: isOpen && isAdmin,
  })

  const canSubmit =
    Boolean(productId) &&
    Boolean(expiryDate) &&
    Boolean(quantity) &&
    (!isAdmin || Boolean(branchId))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    onSubmit({
      productId,
      expiryDate,
      quantity: Number(quantity),
      batchNo: batchNo || undefined,
      notes: notes || undefined,
      branchId: isAdmin ? branchId : undefined,
    })
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receive batch" maxWidth="md">
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
                .filter((branch) => branch.isActive)
                .map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            type="date"
            label="Expiry date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
          <Input
            type="number"
            step="0.001"
            min="0"
            label="Quantity"
            placeholder="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <Input
          label="Batch no. (optional)"
          value={batchNo}
          onChange={(e) => setBatchNo(e.target.value)}
        />
        <Input
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Receiving…' : 'Receive batch'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
