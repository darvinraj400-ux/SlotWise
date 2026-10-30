import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 text-center",
        compact ? "py-8" : "py-14",
        className,
      )}
    >
      <div className="flex size-11 items-center justify-center rounded-xl border border-border/80 bg-background text-muted-foreground shadow-card">
        <Icon className="size-5" strokeWidth={1.8} />
      </div>
      <h3 className="mt-4 text-sm font-semibold tracking-[-0.01em] text-foreground">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
