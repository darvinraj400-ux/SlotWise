import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarCheck2,
  CalendarDays,
  Clock3,
  Mail,
  NotebookText,
  Phone,
  TriangleAlert,
} from "lucide-react";
import { ActiveBadge, StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { InitialsAvatar } from "@/components/app/avatar";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StaffDetailActions } from "@/components/staff/staff-detail-actions";
import { TimeOffSection } from "@/components/staff/time-off-section";
import { WorkingHoursEditor } from "@/components/staff/working-hours-editor";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSession } from "@/lib/auth/context";
import {
  getStaffById,
  getStaffSchedule,
  getStaffTimeOff,
  getStaffUpcomingAppointments,
} from "@/lib/data/staff";
import { isAppointmentStatus } from "@/lib/appointments/status";
import { formatDuration } from "@/lib/appointments/booking";
import { uuidSchema } from "@/lib/validation/schemas";
import {
  addDaysToKey,
  formatDateLong,
  formatTime,
  formatZoned,
  timeStringToMinutes,
  todayDateKey,
} from "@/lib/time";

export const metadata: Metadata = { title: "Staff member" };

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const { supabase, user, settings } = await requireSession();
  const now = new Date();

  const [staff, schedule, timeOff, upcoming] = await Promise.all([
    getStaffById(supabase, user.id, id),
    getStaffSchedule(supabase, user.id, id),
    getStaffTimeOff(supabase, user.id, id),
    getStaffUpcomingAppointments(supabase, user.id, id, now),
  ]);

  if (!staff) notFound();

  const contactLine = [staff.email, staff.phone].filter(Boolean).join(" · ");
  const totalWeeklyMinutes = schedule.reduce((sum, entry) => {
    const start = timeStringToMinutes(entry.start_time);
    const end = timeStringToMinutes(entry.end_time);
    if (start === null || end === null || end <= start) return sum;
    return sum + (end - start);
  }, 0);

  const todayKey = todayDateKey(settings.timezone, now);
  const defaultDate = addDaysToKey(todayKey, 1, settings.timezone);
  const defaultEndDate = defaultDate;

  return (
    <div>
      <Link
        href="/staff"
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All staff
      </Link>

      <PageHeader
        eyebrow="Staff member"
        title={staff.full_name}
        badge={
          <ActiveBadge
            isActive={staff.is_active}
            activeLabel="Active"
            inactiveLabel="Inactive"
          />
        }
        description={contactLine || "No contact details recorded yet."}
        actions={<StaffDetailActions staff={staff} />}
      />

      {!staff.is_active ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-status-pending-border bg-status-pending-soft p-3.5 text-[12.5px] leading-relaxed text-status-pending">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            This staff member is inactive. Their schedule and history are preserved,
            but they are not offered in new bookings. Reactivate them from the actions
            above.
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="Working days"
          value={schedule.length}
          icon={CalendarDays}
          hint="Days with an interval this week"
        />
        <StatCard
          label="Weekly hours"
          value={formatDuration(totalWeeklyMinutes)}
          icon={Clock3}
          accent="teal"
          hint="Based on current working hours"
        />
        <StatCard
          label="Upcoming"
          value={upcoming.length}
          icon={CalendarCheck2}
          accent="indigo"
          hint="Next active appointments"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_430px]">
        <div className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                  Upcoming appointments
                </h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Next active bookings in {settings.timezone}
                </p>
              </div>
              {staff.is_active ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/appointments/new?staffId=${staff.id}`}>Book</Link>
                </Button>
              ) : null}
            </div>

            {upcoming.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  compact
                  icon={CalendarCheck2}
                  title="No upcoming appointments"
                  description="New bookings assigned to this staff member will appear here."
                />
              </div>
            ) : (
              <>
                <div className="hidden sm:block">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>When</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcoming.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell>
                            <Link
                              href={`/appointments/${appointment.id}`}
                              className="text-[12.5px] font-medium hover:text-primary"
                            >
                              {formatZoned(appointment.start_at, settings.timezone, "EEE, MMM d")}
                            </Link>
                            <p className="text-[11px] tabular-nums text-muted-foreground">
                              {formatTime(appointment.start_at, settings.timezone)}
                            </p>
                          </TableCell>
                          <TableCell className="whitespace-normal wrap-anywhere text-[12.5px]">
                            {appointment.customers?.full_name ?? "—"}
                          </TableCell>
                          <TableCell className="whitespace-normal wrap-anywhere text-[12.5px] text-muted-foreground">
                            {appointment.service_name_snapshot}
                          </TableCell>
                          <TableCell>
                            {isAppointmentStatus(appointment.status) ? (
                              <StatusBadge status={appointment.status} />
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-2.5 p-4 sm:hidden">
                  {upcoming.map((appointment) => (
                    <Link
                      key={appointment.id}
                      href={`/appointments/${appointment.id}`}
                      className="block rounded-xl border border-border/80 p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[12.5px] font-semibold">
                          {formatZoned(appointment.start_at, settings.timezone, "EEE, MMM d")}
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            {formatTime(appointment.start_at, settings.timezone)}
                          </span>
                        </p>
                        {isAppointmentStatus(appointment.status) ? (
                          <StatusBadge status={appointment.status} />
                        ) : null}
                      </div>
                      <p className="mt-1 text-[12px]">
                        {appointment.customers?.full_name ?? "Customer"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {appointment.service_name_snapshot}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </section>

          <TimeOffSection
            staffId={staff.id}
            staffName={staff.full_name}
            entries={timeOff}
            timezone={settings.timezone}
            defaultDate={defaultDate}
            defaultEndDate={defaultEndDate}
            nowIso={now.toISOString()}
          />
        </div>

        <div className="min-w-0 space-y-5">
          <WorkingHoursEditor
            staffId={staff.id}
            schedule={schedule}
            isActive={staff.is_active}
          />

          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <InitialsAvatar name={staff.full_name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold">{staff.full_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  On the team since{" "}
                  {formatZoned(staff.created_at, settings.timezone, "MMM yyyy")}
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 border-t border-border/70 pt-4">
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="sr-only">Email</dt>
                  <dd className="break-all text-[12.5px]">
                    {staff.email ? (
                      <a href={`mailto:${staff.email}`} className="hover:text-primary">
                        {staff.email}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">No email recorded</span>
                    )}
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div>
                  <dt className="sr-only">Phone</dt>
                  <dd className="text-[12.5px]">
                    {staff.phone ? (
                      <a href={`tel:${staff.phone}`} className="hover:text-primary">
                        {staff.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">No phone recorded</span>
                    )}
                  </dd>
                </div>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-border/70 bg-muted/35 p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                <NotebookText className="size-3.5" />
                Notes
              </p>
              <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed">
                {staff.notes || "No notes yet."}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-border/80 bg-muted/35 p-5">
            <h2 className="text-[13px] font-semibold">Today at a glance</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              {formatDateLong(now, settings.timezone)}
              <br />
              Bookings are validated against this staff member&apos;s working hours and
              recorded time off before they are saved.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
