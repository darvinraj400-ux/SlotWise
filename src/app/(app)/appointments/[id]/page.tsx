import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  CircleCheck,
  ClipboardList,
  Clock3,
  History,
  Mail,
  NotebookText,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { AppointmentStatusActions } from "@/components/appointments/appointment-status-actions";
import { EmptyState } from "@/components/app/empty-state";
import { InitialsAvatar } from "@/components/app/avatar";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/context";
import {
  getAppointmentById,
  getAppointmentEvents,
} from "@/lib/data/appointments";
import {
  formatDateLong,
  formatDateTimeFull,
  formatMoney,
  formatTime,
} from "@/lib/time";
import { formatDuration } from "@/lib/appointments/booking";
import { isAppointmentStatus } from "@/lib/appointments/status";
import { uuidSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Appointment" };

const EVENT_ICONS = {
  created: Plus,
  rescheduled: CalendarClock,
  status_changed: RefreshCw,
  notes_updated: Pencil,
} as const;

export default async function AppointmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const query = await searchParams;
  const { supabase, user, settings } = await requireSession();

  const [appointment, events] = await Promise.all([
    getAppointmentById(supabase, user.id, id),
    getAppointmentEvents(supabase, user.id, id),
  ]);

  if (!appointment) notFound();

  const status = isAppointmentStatus(appointment.status)
    ? appointment.status
    : "pending";
  const reschedulable = status === "pending" || status === "confirmed";
  const created = query.created === "1";
  const rescheduled = query.rescheduled === "1";

  return (
    <div>
      <Link
        href="/appointments"
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All appointments
      </Link>

      {(created && status === "pending") || rescheduled ? (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-status-completed-border bg-status-completed-soft p-3.5 text-[13px] text-status-completed">
          <CheckCircle2 className="size-4 shrink-0" />
          {created
            ? "Appointment booked. It is pending until you confirm it."
            : "Appointment rescheduled. The updated time is shown below."}
        </div>
      ) : null}

      <PageHeader
        eyebrow="Appointment"
        title={appointment.service_name_snapshot}
        badge={<StatusBadge status={status} />}
        description={`${appointment.customers?.full_name ?? "Customer"} · ${formatDateLong(
          appointment.start_at,
          settings.timezone,
        )} · ${formatTime(appointment.start_at, settings.timezone)}`}
        actions={
          <>
            {reschedulable ? (
              <Button asChild variant="outline" className="gap-1.5">
                <Link href={`/appointments/${appointment.id}/edit`}>
                  <CalendarClock className="size-4" />
                  Reschedule
                </Link>
              </Button>
            ) : null}
            <Button asChild className="gap-1.5">
              <Link
                href={`/appointments/new?customerId=${appointment.customer_id}`}
              >
                <CalendarPlus className="size-4" />
                Book another
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
            <div className="border-b border-border/80 px-5 py-4">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.015em]">
                <ClipboardList className="size-4 text-primary" />
                Booking details
              </h2>
            </div>

            <div className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  When
                </p>
                <p className="mt-1.5 text-[13.5px] font-medium">
                  {formatDateLong(appointment.start_at, settings.timezone)}
                </p>
                <p className="text-[12.5px] tabular-nums text-muted-foreground">
                  {formatTime(appointment.start_at, settings.timezone)} –{" "}
                  {formatTime(appointment.end_at, settings.timezone)} ·{" "}
                  {settings.timezone}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Customer
                </p>
                <Link
                  href={`/customers/${appointment.customer_id}`}
                  className="mt-1.5 block text-[13.5px] font-medium hover:text-primary"
                >
                  {appointment.customers?.full_name ?? "View customer"}
                </Link>
                <p className="text-[12px] wrap-anywhere text-muted-foreground">
                  {appointment.customers?.email ||
                    appointment.customers?.phone ||
                    "No contact details"}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Staff
                </p>
                <Link
                  href={`/staff/${appointment.staff_id}`}
                  className="mt-1.5 block text-[13.5px] font-medium hover:text-primary"
                >
                  {appointment.staff?.full_name ?? "View staff member"}
                </Link>
                <p className="text-[12px] text-muted-foreground">Scheduling resource</p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Service snapshot
                </p>
                <p className="mt-1.5 text-[13.5px] font-medium">
                  {appointment.service_name_snapshot}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {formatDuration(appointment.duration_minutes_snapshot)} ·{" "}
                  {formatMoney(appointment.price_amount_snapshot, settings.currency_code)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Booked
                </p>
                <p className="mt-1.5 text-[12.5px]">
                  {formatDateTimeFull(appointment.created_at, settings.timezone)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Last updated{" "}
                  {formatDateTimeFull(appointment.updated_at, settings.timezone)}
                </p>
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Price snapshotted
                </p>
                <p className="mt-1.5 text-[17px] font-semibold tabular-nums">
                  {formatMoney(appointment.price_amount_snapshot, settings.currency_code)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Historical price, independent of the catalogue
                </p>
              </div>
            </div>

            <div className="border-t border-border/80 px-5 py-4">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <NotebookText className="size-3.5" />
                Notes
              </p>
              <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed">
                {appointment.notes || "No notes on this appointment."}
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
            <div className="border-b border-border/80 px-5 py-4">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.015em]">
                <History className="size-4 text-primary" />
                Appointment timeline
              </h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Created, rescheduled, and status changes are recorded.
              </p>
            </div>

            {events.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  compact
                  icon={CircleCheck}
                  title="No events recorded"
                  description="Activity for this booking will appear here."
                />
              </div>
            ) : (
              <ol className="space-y-0 p-5">
                {events.map((event, index) => {
                  const Icon =
                    EVENT_ICONS[event.event_type as keyof typeof EVENT_ICONS] ??
                    CircleCheck;
                  return (
                    <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {index < events.length - 1 ? (
                        <span
                          className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px bg-border"
                          aria-hidden
                        />
                      ) : null}
                      <span className="relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                        <Icon className="size-3.5" />
                      </span>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-[12.5px] font-medium">
                          {event.summary}
                        </p>
                        <p className="mt-0.5 text-[10.5px] text-muted-foreground">
                          {formatDateTimeFull(event.created_at, settings.timezone)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="flex items-start gap-2.5 rounded-2xl border border-border/80 bg-muted/30 p-4 text-[11.5px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            Service name, duration, and price are snapshotted at booking time. Editing
            the catalogue later cannot silently change this appointment&apos;s history.
          </section>
        </div>

        <aside className="min-w-0 space-y-4">
          <AppointmentStatusActions
            appointmentId={appointment.id}
            status={status}
            startAt={appointment.start_at}
            endAt={appointment.end_at}
            nowIso={new Date().toISOString()}
            customerId={appointment.customer_id}
          />

          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold">
              <UserRound className="size-4 text-primary" />
              Customer
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <InitialsAvatar
                name={appointment.customers?.full_name ?? "Customer"}
                size="lg"
              />
              <div className="min-w-0">
                <Link
                  href={`/customers/${appointment.customer_id}`}
                  className="block truncate text-[13.5px] font-semibold hover:text-primary"
                >
                  {appointment.customers?.full_name ?? "View customer"}
                </Link>
                <p className="text-[11px] text-muted-foreground">Appointment customer</p>
              </div>
            </div>
            <div className="mt-4 space-y-2.5 border-t border-border/70 pt-3.5 text-[12px]">
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="break-all">
                  {appointment.customers?.email ?? "No email recorded"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                <span>{appointment.customers?.phone ?? "No phone recorded"}</span>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="mt-4 w-full">
              <Link href={`/customers/${appointment.customer_id}`}>View customer</Link>
            </Button>
          </section>

          <section className="rounded-2xl border border-border/80 bg-muted/35 p-4">
            <h2 className="flex items-center gap-2 text-[12px] font-semibold">
              <Clock3 className="size-3.5 text-primary" />
              Booking time zone
            </h2>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
              Displayed in {settings.timezone}. Stored as an exact instant, so changing
              business settings later does not move this booking.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
