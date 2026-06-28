import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { FRONTEND_ROUTES } from '@/constants/routes'
import { useGroup } from '@/features/customer-groups/hooks/useGroup'
import { useGroupAnalytics } from '@/features/customer-groups/hooks/useGroupAnalytics'

function daysAgoIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export function useGroupAnalyticsPage() {
  const { id } = useParams<{ id: string }>()
  const [startDate, setStartDate] = useState(() => daysAgoIso(30))
  const [endDate, setEndDate] = useState(() => todayIso())

  // Match the brand-analytics window convention: whole-day end boundary.
  const params = useMemo(
    () => ({
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(`${endDate}T23:59:59`).toISOString(),
    }),
    [startDate, endDate],
  )

  const { data: group } = useGroup(id)
  const { data, isLoading, isError } = useGroupAnalytics(id, params)

  return {
    group,
    data,
    isLoading,
    isError,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    maxDate: todayIso(),
    detailPath: FRONTEND_ROUTES.SHOP_GROUP_DETAIL.replace(':id', id ?? ''),
  }
}
