import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/constants/enums'
import { CategoryManageTab } from './CategoryManageTab'
import { CategoryAnalyticsTab } from './CategoryAnalyticsTab'
import { cn } from '@/lib/utils'

type CategoryView = 'manage' | 'analytics'

/**
 * Categories panel for the Inventory workspace tab — Manage + Sales-analytics
 * sub-views. No page-level header: the inventory workspace tab strip already
 * provides the context.
 */
export function CategoriesPanel() {
  const { user } = useAuth()
  const isAdmin = user?.role === UserRole.ADMIN
  const [view, setView] = useState<CategoryView>('manage')

  return (
    <div>
      <div className="flex gap-1 mb-5 border-b border-border">
        <SubTab active={view === 'manage'} onClick={() => setView('manage')}>
          Manage
        </SubTab>
        <SubTab
          active={view === 'analytics'}
          onClick={() => setView('analytics')}
        >
          Sales analytics
        </SubTab>
      </div>
      {view === 'manage' ? (
        <CategoryManageTab isAdmin={isAdmin} />
      ) : (
        <CategoryAnalyticsTab isAdmin={isAdmin} />
      )}
    </div>
  )
}

function SubTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
        active
          ? 'border-primary text-text-1'
          : 'border-transparent text-text-3 hover:text-text-1',
      )}
    >
      {children}
    </button>
  )
}
