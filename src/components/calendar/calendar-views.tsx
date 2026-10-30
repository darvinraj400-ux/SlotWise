import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  STATUS_META,
  isAppointmentStatus,
} from "@/lib/appointments/status";
import { layoutIntervals } from "@/lib/appointments/layout";
import { minuteOfDayInZone } from "@/lib/appointments/booking";
import type { AppointmentWithDetails } from "@/lib/data/appointments";
import {
  formatTime,
  formatTimeOfDay,
  formatZoned,
  zonedNoon,
} from "@/lib/time";
import { cn } from "@/lib/utils";

const HOUR_HEIGHT = 64;

export function WeekCalendar({
  days,
  appointmentsByDay,
  timezone,
  todayKey,
  dayHref,
}: {
  days: string[];
  appointmentsByDay: Map<string, AppointmentWithDetails[]>;
  timezone: string;
  todayKey: string;
  dayHref: (dateKey: string) => string;
}) {
  const all = days.flatMap((day) => appointmentsByDay.get(day) ?? []);

  let boundStart = 8 * 60;
  let boundEnd = 19 * 60;

  for (const appointment of all) {
    const start = minuteOfDayInZone(appointment.start_at, timezone);
    const end = Math.max(
      start + appointment.duration_minutes_snapshot,
      minuteOfDayInZone(appointment.end_at, timezone),
    );
    boundStart = Math.min(boundStart, Math.floor(start / 60) * 60);
    boundEnd = Math.max(boundEnd, Math.ceil(end / 60) * 60);
  }

  boundStart = Math.max(0, boundStart);
  boundEnd = Math.min(24 * 60, Math.max(boundEnd, boundStart + 60));
  const totalMinutes = boundEnd - boundStart;
  const height = (totalMinutes / 60) * HOUR_HEIGHT;
  const hourCount = totalMinutes / 60;
  const hours = Array.from({ length: hourCount }, (_, index) => boundStart + index * 60);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[900px]">
        <div className="grid grid-cols-[58px_repeat(7,minmax(0,1fr))] border-b border-border/70 bg-muted/20">
          <div />
          {days.map((day) => {
            const date = zonedNoon(day, timezone);
            const isToday = day === todayKey;
            return (
              <Link
                key={day}
                href={dayHref(day)}
                className={cn(
                  "flex flex-col items-center gap-0.5 border-l border-border/70 px-1 py-2.5 transition-colors hover:bg-muted/40",
                  isToday && "bg-primary/[0.04]",
                )}
              >
                <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {formatZoned(date, timezone, "EEE")}
                </span>
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums",
                    isToday ? "bg-primary text-white" : "text-foreground",
                  )}
                >
                  {formatZoned(date, timezone, "d")}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="grid grid-cols-[58px_repeat(7,minmax(0,1fr))]">
          <div className="relative" style={{ height }}>
            {hours.map((minute) => (
              <span
                key={minute}
                className="absolute right-2 -translate-y-1/2 text-[9px] tabular-nums text-muted-foreground"
                style={{ top: ((minute - boundStart) / 60) * HOUR_HEIGHT }}
              >
                {formatTimeOfDay(
                  `${String(Math.floor(minute / 60)).padStart(2, "0")}:00`,
                )}
              </span>
            ))}
          </div>

          {days.map((day) => {
            const dayAppointments = [...(appointmentsByDay.get(day) ?? [])].sort(
              (a, b) =>
                new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
            );
            const laned = layoutIntervals(
              dayAppointments.map((appointment) => ({
                startAt: appointment.start_at,
                endAt: appointment.end_at,
                value: appointment,
              })),
            );

            return (
              <div
                key={day}
                className={cn(
                  "relative border-l border-border/60",
                  day === todayKey && "bg-primary/[0.02]",
                )}
                style={{ height }}
              >
                {hours.map((minute) => (
                  <span
                    key={minute}
                    className="pointer-events-none absolute inset-x-0 border-t border-border/45"
                    style={{ top: ((minute - boundStart) / 60) * HOUR_HEIGHT }}
                    aria-hidden
                  />
                ))}

                {laned.map((item) => {
                  const appointment = item.value;
                  const meta = isAppointmentStatus(appointment.status)
                    ? STATUS_META[appointment.status]
                    : STATUS_META.pending;
                  const startMinute = minuteOfDayInZone(
                    appointment.start_at,
                    timezone,
                  );
                  const rawEndMinute = minuteOfDayInZone(
                    appointment.end_at,
                    timezone,
                  );
                  const endMinute =
                    rawEndMinute > startMinute
                      ? rawEndMinute
                      : startMinute + appointment.duration_minutes_snapshot;
                  const top = ((startMinute - boundStart) / 60) * HOUR_HEIGHT;
                  const blockHeight = Math.max(
                    ((endMinute - startMinute) / 60) * HOUR_HEIGHT,
                    26,
                  );
                  const canReschedule =
                    appointment.status === "pending" ||
                    appointment.status === "confirmed";

                  return (
                    <div
                      key={appointment.id}
                      className="absolute px-[2px] py-[1px]"
                      style={{
                        top,
                        height: blockHeight,
                        left: `${(item.lane / item.laneCount) * 100}%`,
                        width: `${(1 / item.laneCount) * 100}%`,
                      }}
                    >
                      <div
                        className={cn(
                          "group relative flex h-full overflow-hidden rounded-md border border-l-[3px] text-[10px] shadow-sm transition-shadow hover:shadow-md",
                          meta.blockClass,
                        )}
                      >
                        <Link
                          href={`/appointments/${appointment.id}`}
                          className="absolute inset-0 z-10 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                          aria-label={`${appointment.service_name_snapshot} with ${
                            appointment.customers?.full_name ?? "customer"
                          } at ${formatTime(appointment.start_at, timezone)}, status ${meta.label}`}
                        />
                        <div className="pointer-events-none min-w-0 px-1.5 py-1 leading-tight">
                          <p className="truncate text-[8.5px] font-semibold tabular-nums opacity-85">
                            {formatTime(appointment.start_at, timezone)}
                          </p>
                          <p className="truncate text-[10px] font-semibold text-foreground">
                            {appointment.customers?.full_name ?? "Customer"}
                          </p>
                          {blockHeight > 40 ? (
                            <p className="truncate text-[9px] opacity-80">
                              {appointment.service_name_snapshot}
                            </p>
                          ) : null}
                          {blockHeight > 58 ? (
                            <p className="truncate text-[8.5px] opacity-70">
                              {appointment.staff?.full_name ?? "Unassigned"}
                            </p>
                          ) : null}
                        </div>
                        {canReschedule ? (
                          <Link
                            href={`/appointments/${appointment.id}/edit`}
                            className="absolute right-1 top-1 z-20 hidden size-4 items-center justify-center rounded bg-white/70 text-foreground/70 backdrop-blur-sm hover:text-primary group-hover:flex group-focus-within:flex"
                            aria-label={`Reschedule ${appointment.service_name_snapshot}`}
                          >
                            <Pencil className="size-2.5" />
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function MonthCalendar({
  days,
  appointmentsByDay,
  timezone,
  todayKey,
  dayHref,
}: {
  days: { dateKey: string; inMonth: boolean }[];
  appointmentsByDay: Map<string, AppointmentWithDetails[]>;
  timezone: string;
  todayKey: string;
  dayHref: (dateKey: string) => string;
}) {
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div>
      <div className="grid grid-cols-7 border-b border-border/70 bg-muted/20">
        {weekdays.map((weekday) => (
          <div
            key={weekday}
            className="px-2 py-2 text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border/70">
        {days.map(({ dateKey, inMonth }) => {
          const dayAppointments = appointmentsByDay.get(dateKey) ?? [];
          const isToday = dateKey === todayKey;
          return (
            <div
              key={dateKey}
              className={cn(
                "min-h-[122px] bg-card p-1.5",
                !inMonth && "bg-muted/30",
                isToday && "bg-primary/[0.025]",
              )}
            >
              <div className="flex items-center justify-between">
                <Link
                  href={dayHref(dateKey)}
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums transition-colors hover:bg-muted",
                    isToday
                      ? "bg-primary text-white hover:bg-primary/90"
                      : inMonth
                        ? "text-foreground"
                        : "text-muted-foreground/70",
                  )}
                  aria-label={`View ${dateKey}`}
                >
                  {Number(dateKey.slice(8, 10))}
                </Link>
                {dayAppointments.length > 3 ? (
                  <span className="text-[9px] text-muted-foreground">
                    {dayAppointments.length}
                  </span>
                ) : null}
              </div>

              <div className="mt-1 space-y-1">
                {dayAppointments.slice(0, 3).map((appointment) => {
                  const meta = isAppointmentStatus(appointment.status)
                    ? STATUS_META[appointment.status]
                    : STATUS_META.pending;
                  return (
                    <Link
                      key={appointment.id}
                      href={`/appointments/${appointment.id}`}
                      className={cn(
                        "flex items-center gap-1 truncate rounded border border-l-2 px-1 py-[3px] text-[9px] leading-tight",
                        meta.blockClass,
                      )}
                      title={`${formatTime(appointment.start_at, timezone)} · ${
                        appointment.customers?.full_name ?? "Customer"
                      } · ${appointment.service_name_snapshot}`}
                    >
                      <span
                        className={cn("size-1 shrink-0 rounded-full", meta.dotClass)}
                        aria-hidden
                      />
                      <span className="shrink-0 font-semibold tabular-nums">
                        {formatZoned(appointment.start_at, timezone, "h:mma").toLowerCase()}
                      </span>
                      <span className="truncate text-foreground/85">
                        {appointment.customers?.full_name ?? "Customer"}
                      </span>
                    </Link>
                  );
                })}
                {dayAppointments.length > 3 ? (
                  <Link
                    href={dayHref(dateKey)}
                    className="block px-1 text-[9px] font-medium text-primary hover:underline"
                  >
                    +{dayAppointments.length - 3} more
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
