import { ReactNode } from 'react'
import { FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description: string
  icon?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-8 text-center animate-in fade-in duration-500">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-900 mb-4">
        {icon || <FolderOpen className="h-10 w-10 text-slate-600" />}
      </div>
      <h3 className="mb-1 text-xl font-semibold text-slate-200">{title}</h3>
      <p className="mb-6 max-w-sm text-sm text-slate-400">{description}</p>
      {action && <div>{action}</div>}
    </div>
  )
}
