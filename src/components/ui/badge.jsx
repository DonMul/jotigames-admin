import * as React from 'react'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
        secondary: 'border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        success: 'border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
        destructive: 'border-transparent bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
        outline: 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400',
        warning: 'border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
