import { Badge } from "@/components/ui/badge";
import { STATUS_META, type AppointmentStatus } from "@/lib/appointments/status";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1.5 rounded-md border px-2 text-[11px] font-semibold tracking-[0.01em]",
        meta.badgeClass,
        className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", meta.dotClass)} aria-hidden />
      {meta.label}
    </Badge>
  );
}

export function ActiveBadge({
  isActive,
  activeLabel = "Active",
  inactiveLabel = "Archived",
  className,
}: {
  isActive: boolean;
  activeLabel?: string;
  inactiveLabel?: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 rounded-md border px-2 text-[11px] font-semibold",
        isActive
          ? "border-status-completed-border bg-status-completed-soft text-status-completed"
          : "border-border bg-muted/60 text-muted-foreground",
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          isActive ? "bg-status-completed" : "bg-muted-foreground/60",
        )}
        aria-hidden
      />
      {isActive ? activeLabel : inactiveLabel}
    </Badge>
  );
}
