import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const statusBadgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border",
  {
    variants: {
      status: {
        active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        paused: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        ready: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        building: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        error: "bg-red-500/10 text-red-500 border-red-500/20",
        cancelled: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
        queued: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
        pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        expired: "bg-red-500/10 text-red-500 border-red-500/20",
        default: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
      },
    },
    defaultVariants: {
      status: "default",
    },
  }
);

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusBadgeVariants> {
  status: any;
  label?: string;
}

export function StatusBadge({ status, label, className, ...props }: StatusBadgeProps) {
  const normalizedStatus = typeof status === 'string' ? status.toLowerCase() : 'default';
  
  // Try to map unknown statuses to known variants
  let variantStatus: any = 'default';
  if (['active', 'ready'].includes(normalizedStatus)) variantStatus = 'active';
  if (['paused', 'building', 'pending'].includes(normalizedStatus)) variantStatus = 'building';
  if (['error', 'expired'].includes(normalizedStatus)) variantStatus = 'error';
  if (['queued', 'cancelled'].includes(normalizedStatus)) variantStatus = 'queued';

  return (
    <span className={cn(statusBadgeVariants({ status: variantStatus }), className)} {...props}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label || status}
    </span>
  );
}