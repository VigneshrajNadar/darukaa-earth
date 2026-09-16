import { HTMLAttributes, forwardRef } from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error'
  title?: string
  icon?: boolean
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className = '', variant = 'info', title, icon = true, children, ...props }, ref) => {
    const variants = {
      info: 'bg-ocean-500/10 border-ocean-500/20 text-ocean-400',
      success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      warning: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      error: 'bg-red-500/10 border-red-500/20 text-red-400',
    }

    const Icon = {
      info: Info,
      success: CheckCircle2,
      warning: AlertTriangle,
      error: AlertCircle,
    }[variant]

    return (
      <div
        ref={ref}
        className={`rounded-lg border p-4 ${variants[variant]} ${className}`}
        {...props}
      >
        <div className="flex gap-3">
          {icon && <Icon className="mt-0.5 h-5 w-5 shrink-0" />}
          <div className="flex-1">
            {title && <h5 className="mb-1 font-medium leading-none tracking-tight">{title}</h5>}
            <div className="text-sm opacity-90">{children}</div>
          </div>
        </div>
      </div>
    )
  }
)

Alert.displayName = 'Alert'
