import { StatusBadge } from "@/components/app/status-badge";
import {
  isAppointmentStatus,
  STATUS_META,
} from "@/lib/appointments/status";

export function AppointmentStatusBadge({ status }: { status: string }) {
  if (!isAppointmentStatus(status)) {
    return (
      <span className="text-[11px] font-medium capitalize text-muted-foreground">
        {status.replace(/_/g, " ")}
      </span>
    );
  }
  return <StatusBadge status={status} />;
}

export { STATUS_META };
