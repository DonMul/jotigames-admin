import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse-soft rounded-lg bg-slate-200 dark:bg-slate-800', className)}
      {...props}
    />
  )
}

export { Skeleton }
