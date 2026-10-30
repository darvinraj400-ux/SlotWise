import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "default",
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  accent?: "default" | "teal" | "amber" | "rose" | "indigo";
  className?: string;
}) {
  const iconClasses = {
    default: "bg-muted text-muted-foreground",
    teal: "bg-status-confirmed-soft text-status-confirmed",
    amber: "bg-status-pending-soft text-status-pending",
    rose: "bg-status-cancelled-soft text-status-cancelled",
    indigo: "bg-status-progress-soft text-status-progress",
  } as const;

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-4 shadow-card sm:p-5",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            iconClasses[accent],
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-foreground">
        {value}
      </p>
      {hint ? (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
