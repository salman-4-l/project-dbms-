import type { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-[60vh] bg-muted/30 py-8">{children}</div>
}
