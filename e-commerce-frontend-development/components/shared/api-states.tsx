'use client'

import type { LucideIcon } from 'lucide-react'
import { CloudOff, Construction, PackageOpen, RefreshCw, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { API_BASE_URL, ApiError } from '@/lib/api'
import { cn } from '@/lib/utils'

interface StatePanelProps {
  icon: LucideIcon
  title: string
  description: React.ReactNode
  action?: React.ReactNode
  className?: string
  tone?: 'default' | 'error' | 'warning'
}

export function StatePanel({
  icon: Icon,
  title,
  description,
  action,
  className,
  tone = 'default',
}: StatePanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed bg-card px-6 py-16 text-center',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-12 items-center justify-center rounded-full bg-secondary',
          tone === 'error' && 'bg-destructive/10 text-destructive',
          tone === 'warning' && 'bg-warning/10 text-warning',
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="flex max-w-md flex-col gap-1.5">
        <h3 className="font-medium text-balance">{title}</h3>
        <div className="text-sm leading-relaxed text-pretty text-muted-foreground">{description}</div>
      </div>
      {action}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: React.ReactNode
  action?: React.ReactNode
}) {
  return <StatePanel icon={PackageOpen} title={title} description={description} action={action} />
}

export function ApiErrorState({
  error,
  onRetry,
  className,
}: {
  error: unknown
  onRetry?: () => void
  className?: string
}) {
  const apiError = error instanceof ApiError ? error : null
  const retry = onRetry && (
    <Button variant="outline" onClick={onRetry}>
      <RefreshCw data-icon="inline-start" />
      Try again
    </Button>
  )

  if (apiError?.kind === 'not-implemented') {
    return (
      <StatePanel
        className={className}
        tone="warning"
        icon={Construction}
        title="Backend endpoint not available yet"
        description={
          <>
            The frontend is ready, but the Express server does not expose{' '}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
              {apiError.endpoint}
            </code>{' '}
            yet. Add this route to the backend to load real data here.
          </>
        }
        action={retry}
      />
    )
  }

  if (apiError?.kind === 'network') {
    return (
      <StatePanel
        className={className}
        tone="error"
        icon={CloudOff}
        title="Can't reach the store backend"
        description={
          <>
            No response from{' '}
            <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
              {API_BASE_URL}
            </code>
            . Start the Express server and make sure CORS is enabled for this origin.
          </>
        }
        action={retry}
      />
    )
  }

  return (
    <StatePanel
      className={className}
      tone="error"
      icon={TriangleAlert}
      title="Something went wrong"
      description={error instanceof Error ? error.message : 'The request could not be completed.'}
      action={retry}
    />
  )
}
