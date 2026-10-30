import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Circle,
  CircleCheck,
  CircleX,
  Clock3,
  Plus,
  Sparkles,
} from "lucide-react";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { InitialsAvatar } from "@/components/app/avatar";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { ServiceDemandChart, StatusMixChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/context";
import { getDashboardData, parseRangePreset } from "@/lib/data/dashboard";
import { firstParam } from "@/lib/data/helpers";
import {
  appointmentSummary,
  percentage,
  serviceBreakdown,
  statusChartData,
} from "@/lib/reports";
import { isAppointmentStatus } from "@/lib/appointments/status";
import {
  addDaysToKey,
  formatDateKey,
  formatMoney,
  formatTime,
  formatZoned,
  todayDateKey,
  type RangePreset,
} from "@/lib/time";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Overview" };

const RANGE_OPTIONS: { value: RangePreset; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "month", label: "This month" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, user, settings } = await requireSession();

  const preset = parseRangePreset(firstParam(params.range));
  const now = new Date();

  const data = await getDashboardData(
    supabase,
    user.id,
    settings.timezone,
    preset,
    now,
  );

  const summary = appointmentSummary(data.appointments);
  const statuses = statusChartData(data.appointments);
  const services = serviceBreakdown(data.appointments);
  const todayKey = todayDateKey(settings.timezone, now);
  const tomorrowKey = addDaysToKey(todayKey, 1, settings.timezone);
  const todayCompleted = data.todayAppointments.filter(
    (appointment) => appointment.status === "completed",
  ).length;
  const todayScheduled = data.todayAppointments.filter(
    (appointment) => appointment.status !== "cancelled",
  ).length;

  const setupSteps = [
    {
      key: "services",
      label: "Add a service",
      description: "Duration and price define each booking.",
      href: "/services",
      done: data.counts.services > 0,
    },
    {
      key: "staff",
      label: "Add your team",
      description: "Set weekly hours so availability is real.",
      href: "/staff",
      done: data.counts.staff > 0,
    },
    {
      key: "customers",
      label: "Add a customer",
      description: "Every appointment belongs to someone.",
      href: "/customers",
      done: data.counts.customers > 0,
    },
  ];
  const needsSetup = setupSteps.some((step) => !step.done);

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Overview"
        description={`A live pulse of ${settings.business_name}. ${data.rangeLabel} in ${settings.timezone}.`}
        actions={
          <>
            <div
              className="flex items-center rounded-lg border border-border/80 bg-card p-0.5 shadow-card"
              role="group"
              aria-label="Reporting period"
            >
              {RANGE_OPTIONS.map((option) => (
                <Link
                  key={option.value}
                  href={`/dashboard?range=${option.value}`}
                  aria-current={preset === option.value ? "page" : undefined}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                    preset === option.value
                      ? "bg-muted text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {option.label}
                </Link>
              ))}
            </div>
            <Button asChild className="gap-1.5">
              <Link href="/appointments/new">
                <Plus className="size-4" />
                New appointment
              </Link>
            </Button>
          </>
        }
      />

      {needsSetup ? (
        <section className="mb-5 rounded-2xl border border-primary/15 bg-[linear-gradient(135deg,rgba(15,118,110,0.06),rgba(255,255,255,0)_55%)] p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                Set up your workspace
              </h2>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                Three quick steps before your first booking. Everything is scoped to
                your business.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            {setupSteps.map((step) => (
              <Link
                key={step.key}
                href={step.href}
                className={cn(
                  "flex items-start gap-2.5 rounded-xl border bg-card p-3 transition-colors",
                  step.done
                    ? "border-border/70"
                    : "border-primary/20 hover:border-primary/40 hover:bg-primary/[0.02]",
                )}
              >
                {step.done ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-status-completed" />
                ) : (
                  <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                )}
                <div>
                  <p className="text-[12.5px] font-medium">{step.label}</p>
                  <p className="mt-0.5 text-[10.5px] leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Today"
          value={todayScheduled}
          icon={CalendarDays}
          accent="teal"
          hint={`${todayCompleted} completed today`}
        />
        <StatCard
          label="Upcoming"
          value={data.upcomingCount}
          icon={Clock3}
          accent="indigo"
          hint="Next 7 days"
        />
        <StatCard
          label="Completed"
          value={summary.completed}
          icon={CheckCircle2}
          hint={
            summary.total === 0
              ? "No bookings in this period"
              : `${percentage(summary.completed, summary.total)}% of ${summary.total} bookings`
          }
        />
        <StatCard
          label="Cancelled"
          value={summary.cancelled}
          icon={CircleX}
          accent="rose"
          hint={`${summary.noShow} no-show${summary.noShow === 1 ? "" : "s"} in period`}
        />
        <StatCard
          label="Revenue"
          value={formatMoney(summary.revenue, settings.currency_code)}
          icon={Banknote}
          accent="amber"
          hint={`From ${summary.completed} completed visits`}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {!needsSetup && data.appointments.length === 0 && data.upcoming.length === 0 ? (
        <section className="mt-5 flex flex-col items-start justify-between gap-3 rounded-2xl border border-border/80 bg-card p-5 shadow-card sm:flex-row sm:items-center">
          <div>
            <h2 className="text-[14px] font-semibold">Your workspace is ready</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Book the first appointment and your overview will start filling in.
            </p>
          </div>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/appointments/new">
              <Plus className="size-3.5" />
              New appointment
            </Link>
          </Button>
        </section>
      ) : null}

      <div className="mt-5 grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="min-w-0 space-y-5">
          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                  Appointments by status
                </h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {data.rangeLabel} · {summary.total} total
                </p>
              </div>
              <Link
                href="/appointments"
                className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                View all
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
            <div className="mt-4">
              <StatusMixChart data={statuses} total={summary.total} />
            </div>
          </section>

          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                  Service demand
                </h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Top services in this period
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-[9.5px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-[#0f766e]" /> Bookings
                </span>
                <span className="flex items-center gap-1">
                  <span className="size-2 rounded-sm bg-[#6366f1]" /> Completed
                </span>
              </div>
            </div>
            <div className="mt-3">
              <ServiceDemandChart data={services} />
            </div>
          </section>
        </div>

        <div className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                  Upcoming schedule
                </h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Your next active bookings
                </p>
              </div>
              <Link
                href="/calendar"
                className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                Calendar
                <ArrowUpRight className="size-3" />
              </Link>
            </div>

            {data.upcoming.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  compact
                  icon={CalendarDays}
                  title="No upcoming appointments"
                  description="Create a booking and it will appear here."
                  action={
                    <Button asChild size="sm">
                      <Link href="/appointments/new">New appointment</Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.upcoming.map((appointment) => {
                  const appointmentDay = formatDateKey(
                    appointment.start_at,
                    settings.timezone,
                  );
                  const dayLabel =
                    appointmentDay === todayKey
                      ? "Today"
                      : appointmentDay === tomorrowKey
                        ? "Tomorrow"
                        : formatZoned(
                            appointment.start_at,
                            settings.timezone,
                            "EEE, MMM d",
                          );
                  return (
                    <li key={appointment.id}>
                      <Link
                        href={`/appointments/${appointment.id}`}
                        className="flex min-w-0 items-center gap-2.5 px-4 py-3.5 transition-colors hover:bg-muted/25 sm:gap-3 sm:px-5"
                      >
                        <div className="w-[62px] shrink-0 text-[10.5px] sm:w-[70px]">
                          <p className="font-semibold">{dayLabel}</p>
                          <p className="mt-0.5 tabular-nums text-muted-foreground">
                            {formatTime(appointment.start_at, settings.timezone)}
                          </p>
                        </div>
                        <InitialsAvatar
                          name={appointment.customers?.full_name ?? "Customer"}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12.5px] font-medium">
                            {appointment.customers?.full_name ?? "Customer"}
                          </p>
                          <p className="truncate text-[10.5px] text-muted-foreground">
                            {appointment.service_name_snapshot}
                            {appointment.staff?.full_name
                              ? ` · ${appointment.staff.full_name}`
                              : ""}
                          </p>
                        </div>
                        {isAppointmentStatus(appointment.status) ? (
                          <AppointmentStatusBadge status={appointment.status} />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
            <div className="flex items-center justify-between gap-3 border-b border-border/80 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                  Recent customers
                </h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Newest in your customer book
                </p>
              </div>
              <Link
                href="/customers"
                className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-primary hover:underline"
              >
                All customers
                <ArrowUpRight className="size-3" />
              </Link>
            </div>

            {data.recentCustomers.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  compact
                  icon={Sparkles}
                  title="No customers yet"
                  description="Add a customer to start building history."
                  action={
                    <Button asChild size="sm">
                      <Link href="/customers">Add customer</Link>
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {data.recentCustomers.map((customer) => (
                  <li key={customer.id}>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="flex min-w-0 items-center gap-2.5 px-4 py-3 transition-colors hover:bg-muted/25 sm:gap-3 sm:px-5"
                    >
                      <InitialsAvatar name={customer.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-medium">
                          {customer.full_name}
                        </p>
                        <p className="truncate text-[10.5px] text-muted-foreground">
                          {customer.email || "No email recorded"}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatZoned(customer.created_at, settings.timezone, "MMM d")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-border/80 bg-muted/30 p-4 text-[11.5px] leading-relaxed text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <CircleCheck className="size-3.5 text-primary" />
              Real numbers only
            </div>
            <p className="mt-1.5">
              Metrics, charts, and reports are calculated from your own appointment
              records and price snapshots — never seeded sample data.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
