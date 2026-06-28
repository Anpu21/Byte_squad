import { useState } from 'react'
import {
  LuCopy as Copy,
  LuCheck as Check,
  LuRefreshCw as RefreshCw,
  LuLink as LinkIcon,
} from 'react-icons/lu'
import toast from 'react-hot-toast'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { FRONTEND_ROUTES } from '@/constants/routes'

interface ShareCodeCardProps {
  joinCode: string
  isOwner: boolean
  onRegenerate: () => void
  regenerating: boolean
}

export function ShareCodeCard({
  joinCode,
  isOwner,
  onRegenerate,
  regenerating,
}: ShareCodeCardProps) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)

  const inviteLink = `${window.location.origin}${FRONTEND_ROUTES.SHOP_GROUPS}?join=${joinCode}`

  const copy = async (value: string, kind: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(kind)
      toast.success(kind === 'code' ? 'Code copied' : 'Invite link copied')
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite people</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-text-2">
          Share this code or link. Anyone with a Ledger Pro account can join.
        </p>
        <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-center">
          <p className="text-[11px] font-medium uppercase tracking-wider text-text-3">
            Join code
          </p>
          <p className="mt-1 font-mono text-xl font-bold tracking-[0.15em] text-text-1">
            {joinCode}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={() => void copy(joinCode, 'code')}
            className="w-full"
          >
            {copied === 'code' ? <Check size={16} /> : <Copy size={16} />} Copy
            code
          </Button>
          <Button
            variant="ghost"
            onClick={() => void copy(inviteLink, 'link')}
            className="w-full"
          >
            {copied === 'link' ? <Check size={16} /> : <LinkIcon size={16} />}{' '}
            Copy invite link
          </Button>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={regenerating}
            className="inline-flex w-full items-center justify-center gap-1.5 text-xs font-medium text-text-3 transition-colors hover:text-text-1 disabled:opacity-50"
          >
            <RefreshCw size={13} className={regenerating ? 'animate-spin' : ''} />{' '}
            Generate a new code
          </button>
        )}
      </CardContent>
    </Card>
  )
}
