import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { inventoryService } from '@/services/inventory.service'
import { queryKeys } from '@/lib/queryKeys'
import type { ICreateProductBatchPayload, IExpiryReportParams } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'

const PAGE_LIMIT = DEFAULT_PAGE_SIZE

export function useExpiryReportPage() {
  const qc = useQueryClient()
  const [withinDays, setWithinDaysState] = useState(30)
  const [page, setPage] = useState(1)
  const [isReceiveOpen, setReceiveOpen] = useState(false)

  const params: IExpiryReportParams = { withinDays, page, limit: PAGE_LIMIT }

  const reportQuery = useQuery({
    queryKey: queryKeys.expiry.report(params),
    queryFn: () => inventoryService.getExpiryReport(params),
  })

  const setWithinDays = (days: number) => {
    setWithinDaysState(days)
    setPage(1)
  }

  const scanMutation = useMutation({
    mutationFn: inventoryService.scanExpiry,
    onSuccess: (summary) =>
      toast.success(
        `Alerted ${summary.notificationsSent} recipient(s) across ${summary.branchesAffected} branch(es)`,
      ),
    onError: () => toast.error('Could not run the expiry scan'),
  })

  const createMutation = useMutation({
    mutationFn: (payload: ICreateProductBatchPayload) =>
      inventoryService.createProductBatch(payload),
    onSuccess: () => {
      toast.success('Batch received')
      setReceiveOpen(false)
      void qc.invalidateQueries({ queryKey: ['expiry'] })
      void qc.invalidateQueries({ queryKey: ['inventory'] })
    },
    onError: () => toast.error('Could not receive the batch'),
  })

  const report = reportQuery.data

  return {
    rows: report?.rows ?? [],
    total: report?.total ?? 0,
    totalPages: report?.totalPages ?? 1,
    limit: PAGE_LIMIT,
    page,
    setPage,
    withinDays,
    setWithinDays,
    isLoading: reportQuery.isLoading,
    isError: reportQuery.isError,
    isReceiveOpen,
    openReceive: () => setReceiveOpen(true),
    closeReceive: () => setReceiveOpen(false),
    runScan: () => scanMutation.mutate(),
    isScanning: scanMutation.isPending,
    submitBatch: (payload: ICreateProductBatchPayload) =>
      createMutation.mutate(payload),
    isCreating: createMutation.isPending,
  }
}
