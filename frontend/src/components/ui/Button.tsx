import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#f5f6f0] disabled:opacity-50 disabled:cursor-not-allowed rounded-md active:scale-[0.98]'

    const variants = {
      primary:
        'bg-earth-600 text-white hover:bg-earth-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-earth-600/20 focus:ring-earth-500 border border-transparent',
      secondary:
        'bg-white text-earth-800 hover:bg-earth-50 focus:ring-earth-500 border border-earth-600/35',
      danger:
        'bg-red-600/10 text-red-500 hover:bg-red-600/20 hover:text-red-400 focus:ring-red-500 border border-red-900/50',
      ghost:
        'bg-transparent text-earth-700 hover:text-earth-900 hover:bg-earth-100/70 focus:ring-earth-500 border border-transparent',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-5 py-2.5 text-base',
    }

    const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

    return (
      <button ref={ref} className={classes} disabled={disabled || isLoading} {...props}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
