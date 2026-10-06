'use client'

import type { SWRResponse } from 'swr'
import type { LucideIcon } from 'lucide-react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApiErrorState, StatePanel } from '@/components/shared/api-states'
import type { ApiError } from '@/lib/api'
import { formatCell, humanizeKey } from '@/lib/format'
import type { ApiRecord } from '@/lib/types'

const STATUS_KEY = /status/i

function StatusPill({ value }: { value: string }) {
  const lower = value.toLowerCase()
  const tone = /(complete|delivered|approved|refunded|paid|success)/.test(lower)
    ? 'bg-success/10 text-success'
    : /(cancel|reject|fail)/.test(lower)
      ? 'bg-destructive/10 text-destructive'
      : 'bg-warning/10 text-warning'
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tone}`}>{value}</span>
}

/** Columns are derived from the rows themselves, so the table matches whatever the MySQL table returns. */
export function RecordsView({
  result,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  label,
}: {
  result: SWRResponse<ApiRecord[], ApiError>
  emptyIcon: LucideIcon
  emptyTitle: string
  emptyDescription: string
  label: string
}) {
  const { data, error, isLoading, isValidating, mutate } = result

  if (isLoading) {
    return (
      <div role="status" aria-label={`Loading ${label}`} className="flex flex-col gap-2 rounded-2xl border bg-card p-4">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
    )
  }

  if (error) return <ApiErrorState error={error} onRetry={() => mutate()} />

  if (!data || data.length === 0) {
    return <StatePanel icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
  }

  const columns = Array.from(new Set(data.flatMap((row) => Object.keys(row))))

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          {data.length} {data.length === 1 ? 'record' : 'records'}
        </p>
        <Button variant="ghost" size="sm" onClick={() => mutate()} disabled={isValidating}>
          <RefreshCw data-icon="inline-start" className={isValidating ? 'animate-spin' : undefined} />
          Refresh
        </Button>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50 hover:bg-secondary/50">
              {columns.map((column) => (
                <TableHead key={column} className="h-11 px-4 text-xs tracking-wide text-muted-foreground uppercase">
                  {humanizeKey(column)}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={String(row[columns[0]] ?? index)}>
                {columns.map((column) => {
                  const value = row[column]
                  return (
                    <TableCell key={column} className="px-4 py-3 tabular-nums">
                      {STATUS_KEY.test(column) && typeof value === 'string' && value ? (
                        <StatusPill value={value} />
                      ) : (
                        formatCell(column, value)
                      )}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
