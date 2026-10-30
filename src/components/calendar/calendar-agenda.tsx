import Link from "next/link";
import { Pencil } from "lucide-react";
import { StatusBadge } from "@/components/app/status-badge";
import { isAppointmentStatus } from "@/lib/appointments/status";
import type { AppointmentWithDetails } from "@/lib/data/appointments";
import { formatZoned, zonedNoon } from "@/lib/time";

export function CalendarAgenda({
  days,
  appointmentsByDay,
  timezone,
  todayKey,
  dayHref,
  hideEmptyDays = false,
}: {
  days: string[];
  appointmentsByDay: Map<string, AppointmentWithDetails[]>;
  timezone: string;
  todayKey: string;
  dayHref: (dateKey: string) => string;
  hideEmptyDays?: boolean;
}) {
  return (
    <div className="divide-y divide-border/70">
      {days.map((day) => {
        const appointments = [...(appointmentsByDay.get(day) ?? [])].sort(
          (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
        );
        if (hideEmptyDays && appointments.length === 0) return null;
        const isToday = day === todayKey;

        return (
          <section key={day} className="px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <Link
                href={dayHref(day)}
                className="group flex items-center gap-2 text-[13px] font-semibold tracking-[-0.01em]"
              >
                <span
                  className={
                    isToday
                      ? "flex size-6 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white"
                      : "flex size-6 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground"
                  }
                >
                  {Number(day.slice(8, 10))}
                </span>
                <span className="group-hover:text-primary">
                  {formatZoned(zonedNoon(day, timezone), timezone, "EEEE, MMMM d")}
                </span>
                {isToday ? (
                  <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-primary">
                    Today
                  </span>
                ) : null}
              </Link>
              <span className="text-[10.5px] tabular-nums text-muted-foreground">
                {appointments.length === 0
                  ? "Open"
                  : `${appointments.length} ${
                      appointments.length === 1 ? "booking" : "bookings"
                    }`}
              </span>
            </div>

            {appointments.length === 0 ? (
              <p className="mt-2 text-[11.5px] text-muted-foreground">
                No appointments scheduled.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {appointments.map((appointment) => {
                  const canReschedule =
                    appointment.status === "pending" ||
                    appointment.status === "confirmed";

                  return (
                    <li
                      key={appointment.id}
                      className="flex gap-3 rounded-xl border border-border/80 bg-background/40 p-3"
                    >
                      <div className="w-[66px] shrink-0 whitespace-nowrap border-r border-border/70 pr-2 text-right">
                        <p className="text-[11px] font-semibold tabular-nums">
                          {formatZoned(appointment.start_at, timezone, "h:mm a")}
                        </p>
                        <p className="text-[9.5px] tabular-nums text-muted-foreground">
                          {formatZoned(appointment.end_at, timezone, "h:mm a")}
                        </p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-1.5">
                          <Link
                            href={`/appointments/${appointment.id}`}
                            className="truncate text-[12.5px] font-semibold hover:text-primary"
                          >
                            {appointment.customers?.full_name ?? "Customer"}
                          </Link>
                          {isAppointmentStatus(appointment.status) ? (
                            <StatusBadge
                              status={appointment.status}
                              className="h-5 px-1.5 text-[9.5px]"
                            />
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {appointment.service_name_snapshot}
                          {appointment.staff?.full_name
                            ? ` · ${appointment.staff.full_name}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-start gap-1">
                        {canReschedule ? (
                          <Link
                            href={`/appointments/${appointment.id}/edit`}
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
                            aria-label={`Reschedule ${appointment.service_name_snapshot}`}
                          >
                            <Pencil className="size-3.5" />
                          </Link>
                        ) : null}
                        <Link
                          href={`/appointments/${appointment.id}`}
                          className="flex h-7 items-center rounded-md px-2 text-[10.5px] font-medium text-primary hover:bg-primary/5"
                        >
                          View
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
