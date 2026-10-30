import type { Metadata } from "next";
import Link from "next/link";
import {
  Banknote,
  CalendarRange,
  CheckCircle2,
  Download,
  Receipt,
  UsersRound,
} from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { StatusBadge } from "@/components/app/status-badge";
import { RevenueByStaffChart } from "@/components/dashboard/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSession } from "@/lib/auth/context";
import { firstParam } from "@/lib/data/helpers";
import { getReportAppointments, resolveReportRange } from "@/lib/data/reports";
import {
  appointmentSummary,
  percentage,
  serviceBreakdown,
  staffBreakdown,
  statusChartData,
} from "@/lib/reports";
import {
  addDaysToKey,
  formatMoney,
  todayDateKey,
} from "@/lib/time";
import { STATUS_META } from "@/lib/appointments/status";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, user, settings } = await requireSession();
  const now = new Date();

  const range = resolveReportRange(
    firstParam(params.from),
    firstParam(params.to),
    settings.timezone,
    now,
  );
  const reportResult = await getReportAppointments(supabase, user.id, range);
  const rangeExceeded = reportResult.exceeded;
  const appointments = rangeExceeded ? [] : reportResult.appointments;
  const summary = appointmentSummary(appointments);
  const statuses = statusChartData(appointments);
  const services = serviceBreakdown(appointments);
  const staff = staffBreakdown(appointments);
  const averageTicket =
    summary.completed > 0
      ? Math.round((summary.revenue / summary.completed) * 100) / 100
      : 0;

  const todayKey = todayDateKey(settings.timezone, now);
  const monthStart = `${todayKey.slice(0, 8)}01`;
  const last30Start = addDaysToKey(todayKey, -29, settings.timezone);
  const exportHref = `/reports/export?from=${range.fromKey}&to=${range.toKey}`;

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Revenue and activity from your own appointment snapshots, measured in your business time zone."
        actions={
          rangeExceeded ? undefined : (
            <Button asChild className="gap-1.5">
              <Link href={exportHref}>
                <Download className="size-4" />
                Export CSV
              </Link>
            </Button>
          )
        }
      />

      <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-card">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <form method="get" className="flex flex-wrap items-end gap-2">
            <label className="flex flex-col gap-1 text-[10.5px] font-medium text-muted-foreground">
              From
              <Input
                type="date"
                name="from"
                defaultValue={range.fromKey}
                className="h-9 w-[150px] bg-background text-[12.5px]"
              />
            </label>
            <label className="flex flex-col gap-1 text-[10.5px] font-medium text-muted-foreground">
              To
              <Input
                type="date"
                name="to"
                defaultValue={range.toKey}
                className="h-9 w-[150px] bg-background text-[12.5px]"
              />
            </label>
            <Button type="submit" variant="secondary" size="sm" className="h-9 px-4">
              Apply range
            </Button>
            <span className="pb-2 text-[11px] text-muted-foreground">
              {range.label}
            </span>
          </form>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Quick ranges
            </span>
            <Button asChild variant="outline" size="sm">
              <Link href={`/reports?from=${monthStart}&to=${todayKey}`}>
                This month
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/reports?from=${last30Start}&to=${todayKey}`}>
                Last 30 days
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {rangeExceeded ? null : (
        <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
          <StatCard
            label="Appointments"
            value={summary.total}
            icon={CalendarRange}
            hint={range.label}
          />
          <StatCard
            label="Completed"
            value={summary.completed}
            icon={CheckCircle2}
            accent="teal"
            hint={`${percentage(summary.completed, summary.total)}% completion rate`}
          />
          <StatCard
            label="Revenue"
            value={formatMoney(summary.revenue, settings.currency_code)}
            icon={Banknote}
            accent="indigo"
            hint="Completed appointment snapshots"
          />
          <StatCard
            label="Average ticket"
            value={formatMoney(averageTicket, settings.currency_code)}
            icon={Receipt}
            accent="amber"
            hint={`${summary.cancelled} cancelled · ${summary.noShow} no-show`}
          />
        </div>
      )}

      {rangeExceeded ? (
        <div className="mt-5">
          <EmptyState
            icon={CalendarRange}
            title="This date range is too large to report"
            description={`The selected range contains more than ${
              reportResult.limit?.toLocaleString() ?? "the maximum"
            } appointments, so no partial totals or CSV export are shown. Narrow the range to see accurate figures.`}
            action={
              <Button asChild variant="outline">
                <Link href="/reports">Reset to this month</Link>
              </Button>
            }
          />
        </div>
      ) : appointments.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={CalendarRange}
            title="No appointments in this range"
            description="Choose a wider date range or create some bookings. Reports only show real records from your workspace."
            action={
              <Button asChild variant="outline">
                <Link href="/appointments/new">New appointment</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
            <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                    Revenue by staff
                  </h2>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Completed visits only · {settings.currency_code}
                  </p>
                </div>
                <UsersRound className="size-4 text-muted-foreground" />
              </div>
              <div className="mt-3">
                <RevenueByStaffChart
                  data={staff.map((row) => ({ name: row.name, revenue: row.revenue }))}
                  currencyCode={settings.currency_code}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                    Appointment status
                  </h2>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    Share of {summary.total} bookings
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-3">
                {statuses.map((status) => (
                  <li key={status.status}>
                    <div className="flex items-center justify-between gap-2 text-[12px]">
                      <StatusBadge status={status.status} />
                      <span className="tabular-nums">
                        {status.count}{" "}
                        <span className="text-muted-foreground">
                          ({percentage(status.count, summary.total)}%)
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${percentage(status.count, summary.total)}%`,
                          backgroundColor: status.color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="mt-5 grid items-start gap-5 xl:grid-cols-2">
            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
              <div className="border-b border-border/80 px-5 py-4">
                <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                  Service popularity
                </h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Bookings and completed revenue by service snapshot
                </p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Service</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {services.map((row) => (
                      <TableRow key={row.name}>
                        <TableCell className="max-w-[220px] truncate text-[12.5px] font-medium">
                          {row.name}
                        </TableCell>
                        <TableCell className="text-right text-[12px] tabular-nums">
                          {row.bookings}
                        </TableCell>
                        <TableCell className="text-right text-[12px] tabular-nums text-muted-foreground">
                          {row.completed}
                        </TableCell>
                        <TableCell className="text-right text-[12px] font-medium tabular-nums">
                          {formatMoney(row.revenue, settings.currency_code)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
              <div className="border-b border-border/80 px-5 py-4">
                <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                  Staff summary
                </h2>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Workload, outcomes, and revenue
                </p>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Staff</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead className="text-right">Done</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((row) => (
                      <TableRow key={row.staffId}>
                        <TableCell>
                          <p className="text-[12.5px] font-medium">{row.name}</p>
                          <p className="text-[10.5px] text-muted-foreground">
                            {row.cancelled} cancelled · {row.noShow} no-show
                          </p>
                        </TableCell>
                        <TableCell className="text-right text-[12px] tabular-nums">
                          {row.bookings}
                        </TableCell>
                        <TableCell className="text-right text-[12px] tabular-nums text-muted-foreground">
                          {row.completed}
                        </TableCell>
                        <TableCell className="text-right text-[12px] font-medium tabular-nums">
                          {formatMoney(row.revenue, settings.currency_code)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4 text-[11.5px] leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Revenue uses the price snapshotted on each completed appointment — editing
              a service later will not change these figures.
            </p>
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-1.5 bg-card">
              <Link href={exportHref}>
                <Download className="size-3.5" />
                Export this range
              </Link>
            </Button>
          </div>
        </>
      )}

      {statuses.length > 0 && appointments.length > 0 ? (
        <p className="mt-3 text-[10.5px] text-muted-foreground">
          Range: {range.fromKey} to {range.toKey} · boundaries calculated in{" "}
          {settings.timezone}. Statuses:{" "}
          {statuses
            .filter((status) => status.count > 0)
            .map((status) => STATUS_META[status.status].label.toLowerCase())
            .join(", ")}
          .
        </p>
      ) : null}
    </div>
  );
}
