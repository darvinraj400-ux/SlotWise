import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { CalendarAgenda } from "@/components/calendar/calendar-agenda";
import { CalendarToolbar } from "@/components/calendar/calendar-toolbar";
import { MonthCalendar, WeekCalendar } from "@/components/calendar/calendar-views";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/context";
import { getAppointmentsInRange, type AppointmentWithDetails } from "@/lib/data/appointments";
import { getStaffOptions } from "@/lib/data/staff";
import { firstParam } from "@/lib/data/helpers";
import {
  addDaysToKey,
  addMonthsToKey,
  dayBounds,
  formatDateKey,
  formatDateLong,
  formatDateRange,
  formatZoned,
  getMonthGrid,
  getWeekKeys,
  parseDateKey,
  todayDateKey,
  zonedNoon,
} from "@/lib/time";

export const metadata: Metadata = { title: "Calendar" };

type CalendarView = "day" | "week" | "month";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, user, settings } = await requireSession();

  const todayKey = todayDateKey(settings.timezone);
  const requestedView = firstParam(params.view);
  const view: CalendarView =
    requestedView === "day" || requestedView === "month"
      ? requestedView
      : "week";
  const requestedDate = firstParam(params.date);
  const dateKey = parseDateKey(requestedDate) ? requestedDate! : todayKey;

  const staffOptions = await getStaffOptions(supabase, user.id, false);
  const requestedStaff = firstParam(params.staff);
  const staffId = staffOptions.some((member) => member.id === requestedStaff)
    ? requestedStaff
    : undefined;

  const weekKeys = getWeekKeys(dateKey, settings.timezone);
  const monthGrid = getMonthGrid(dateKey, settings.timezone);
  let days: string[] = [dateKey];
  let rangeStart = dayBounds(dateKey, settings.timezone).start;
  let rangeEnd = dayBounds(dateKey, settings.timezone).end;
  let label = formatDateLong(zonedNoon(dateKey, settings.timezone), settings.timezone);

  if (view === "week") {
    days = weekKeys;
    rangeStart = dayBounds(weekKeys[0]!, settings.timezone).start;
    rangeEnd = dayBounds(addDaysToKey(weekKeys[6]!, 1, settings.timezone), settings.timezone).start;
    label = formatDateRange(
      dayBounds(weekKeys[0]!, settings.timezone).start,
      dayBounds(weekKeys[6]!, settings.timezone).start,
      settings.timezone,
    );
  } else if (view === "month") {
    const first = monthGrid[0]!.dateKey;
    const last = monthGrid[monthGrid.length - 1]!.dateKey;
    days = monthGrid.map((entry) => entry.dateKey);
    rangeStart = dayBounds(first, settings.timezone).start;
    rangeEnd = dayBounds(addDaysToKey(last, 1, settings.timezone), settings.timezone).start;
    label = formatZoned(zonedNoon(dateKey, settings.timezone), settings.timezone, "MMMM yyyy");
  }

  const appointmentRange = await getAppointmentsInRange(
    supabase,
    user.id,
    rangeStart,
    rangeEnd,
    { staffId },
  );
  const appointments = appointmentRange.appointments;

  const appointmentsByDay = new Map<string, AppointmentWithDetails[]>();
  for (const appointment of appointments) {
    const dayKey = formatDateKey(appointment.start_at, settings.timezone);
    const existing = appointmentsByDay.get(dayKey);
    if (existing) existing.push(appointment);
    else appointmentsByDay.set(dayKey, [appointment]);
  }
  for (const list of appointmentsByDay.values()) {
    list.sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    );
  }

  function buildHref(options: {
    view?: CalendarView;
    date?: string;
    staff?: string | null;
  }) {
    const search = new URLSearchParams();
    search.set("view", options.view ?? view);
    search.set("date", options.date ?? dateKey);
    const nextStaff = options.staff === undefined ? staffId : options.staff;
    if (nextStaff) search.set("staff", nextStaff);
    return `/calendar?${search.toString()}`;
  }

  const previousDate =
    view === "month"
      ? addMonthsToKey(dateKey, -1, settings.timezone)
      : addDaysToKey(dateKey, view === "week" ? -7 : -1, settings.timezone);
  const nextDate =
    view === "month"
      ? addMonthsToKey(dateKey, 1, settings.timezone)
      : addDaysToKey(dateKey, view === "week" ? 7 : 1, settings.timezone);

  const agendaDays =
    view === "month"
      ? monthGrid
          .filter(
            (entry) =>
              entry.inMonth && (appointmentsByDay.get(entry.dateKey)?.length ?? 0) > 0,
          )
          .map((entry) => entry.dateKey)
      : days;

  const newAppointmentHref = `/appointments/new?date=${dateKey}${
    staffId ? `&staffId=${staffId}` : ""
  }`;

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Calendar"
        description={`A live view of your schedule in ${settings.timezone}. Click any booking to open it.`}
        actions={
          <Button asChild className="gap-1.5">
            <Link href={newAppointmentHref}>
              <Plus className="size-4" />
              New appointment
            </Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
        <CalendarToolbar
          view={view}
          label={label}
          staffId={staffId}
          staffOptions={staffOptions}
          viewHrefs={{
            day: buildHref({ view: "day" }),
            week: buildHref({ view: "week" }),
            month: buildHref({ view: "month" }),
          }}
          previousHref={buildHref({ date: previousDate })}
          nextHref={buildHref({ date: nextDate })}
          todayHref={buildHref({ date: todayKey })}
        />

        {appointments.length === 0 ? (
          <div className="border-t border-border/70 p-4 sm:p-6">
            <EmptyState
              icon={CalendarDays}
              title={
                view === "month"
                  ? "Nothing scheduled this month"
                  : view === "day"
                    ? "Nothing scheduled for this day"
                    : "Nothing scheduled this week"
              }
              description={
                staffId
                  ? "Try another period or clear the staff filter to see the whole business."
                  : "Use the arrows to move through time, or create the first appointment for this period."
              }
              action={
                <Button asChild>
                  <Link href={newAppointmentHref}>New appointment</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {view === "day" ? (
              <div className="border-t border-border/70">
                <CalendarAgenda
                  days={days}
                  appointmentsByDay={appointmentsByDay}
                  timezone={settings.timezone}
                  todayKey={todayKey}
                  dayHref={(day) => buildHref({ view: "day", date: day })}
                />
              </div>
            ) : (
              <>
                <div className="hidden border-t border-border/70 md:block">
                  {view === "week" ? (
                    <WeekCalendar
                      days={days}
                      appointmentsByDay={appointmentsByDay}
                      timezone={settings.timezone}
                      todayKey={todayKey}
                      dayHref={(day) =>
                        buildHref({ view: "day", date: day, staff: staffId })
                      }
                    />
                  ) : (
                    <MonthCalendar
                      days={monthGrid}
                      appointmentsByDay={appointmentsByDay}
                      timezone={settings.timezone}
                      todayKey={todayKey}
                      dayHref={(day) =>
                        buildHref({ view: "day", date: day, staff: staffId })
                      }
                    />
                  )}
                </div>

                <div className="border-t border-border/70 md:hidden">
                  {agendaDays.length > 0 ? (
                    <CalendarAgenda
                      days={agendaDays}
                      appointmentsByDay={appointmentsByDay}
                      timezone={settings.timezone}
                      todayKey={todayKey}
                      dayHref={(day) =>
                        buildHref({ view: "day", date: day, staff: staffId })
                      }
                      hideEmptyDays={view === "month"}
                    />
                  ) : (
                    <div className="p-4">
                      <EmptyState
                        compact
                        icon={CalendarDays}
                        title="No appointments in this month"
                        description="Pick another month from the toolbar."
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <p className="mt-3 text-[10.5px] text-muted-foreground">
        Showing times in {settings.timezone}. Overlapping bookings are laid out side by
        side; each block opens the appointment.
      </p>
    </div>
  );
}
