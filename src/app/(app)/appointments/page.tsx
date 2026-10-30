import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarX2,
  ChevronDown,
  Plus,
  Search,
} from "lucide-react";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { InitialsAvatar } from "@/components/app/avatar";
import { PageHeader } from "@/components/app/page-header";
import { PaginationBar } from "@/components/app/pagination-bar";
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
import {
  getAppointmentList,
} from "@/lib/data/appointments";
import { getServiceOptions } from "@/lib/data/services";
import { getStaffOptions } from "@/lib/data/staff";
import { firstParam, parsePageParam } from "@/lib/data/helpers";
import {
  APPOINTMENT_STATUSES,
  STATUS_META,
  isAppointmentStatus,
} from "@/lib/appointments/status";
import {
  dayBounds,
  formatMoney,
  formatTime,
  formatZoned,
  parseDateKey,
} from "@/lib/time";
import { uuidSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Appointments" };

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, user, settings } = await requireSession();

  const search = firstParam(params.q)?.trim().slice(0, 120) ?? "";
  const statusParam = firstParam(params.status);
  const status = statusParam && isAppointmentStatus(statusParam) ? statusParam : undefined;
  const staffParam = firstParam(params.staff);
  const staffId = uuidSchema.safeParse(staffParam).success ? staffParam : undefined;
  const serviceParam = firstParam(params.service);
  const serviceId = uuidSchema.safeParse(serviceParam).success ? serviceParam : undefined;
  const fromKey = firstParam(params.from);
  const toKey = firstParam(params.to);
  const validFrom = parseDateKey(fromKey) ? fromKey! : undefined;
  const validTo = parseDateKey(toKey) ? toKey! : undefined;
  const page = parsePageParam(params.page);

  const [result, staffOptions, serviceOptions] = await Promise.all([
    getAppointmentList(supabase, user.id, {
      search,
      status,
      staffId,
      serviceId,
      from: validFrom ? dayBounds(validFrom, settings.timezone).start : undefined,
      to: validTo ? dayBounds(validTo, settings.timezone).end : undefined,
      page,
    }),
    getStaffOptions(supabase, user.id, false),
    getServiceOptions(supabase, user.id, false),
  ]);

  const hasFilters = Boolean(
    search || status || staffId || serviceId || validFrom || validTo,
  );

  const filterParams = {
    q: search || undefined,
    status: status || undefined,
    staff: staffId,
    service: serviceId,
    from: validFrom,
    to: validTo,
  };

  return (
    <div>
      <PageHeader
        eyebrow="Scheduling"
        title="Appointments"
        description={`Search every booking across your business. Times are shown in ${settings.timezone}.`}
        actions={
          <Button asChild className="gap-1.5">
            <Link href="/appointments/new">
              <Plus className="size-4" />
              New appointment
            </Link>
          </Button>
        }
      />

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
        <div className="border-b border-border/80 p-4">
          <form method="get" className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  name="q"
                  defaultValue={search}
                  placeholder="Search by customer name"
                  className="h-9 bg-background pl-9"
                  aria-label="Search appointments by customer name"
                />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <select
                    name="status"
                    defaultValue={status ?? ""}
                    aria-label="Filter by status"
                    className="h-9 w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-[12.5px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-[150px]"
                  >
                    <option value="">All statuses</option>
                    {APPOINTMENT_STATUSES.map((option) => (
                      <option key={option} value={option}>
                        {STATUS_META[option].label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="relative flex-1 sm:flex-none">
                  <select
                    name="staff"
                    defaultValue={staffId ?? ""}
                    aria-label="Filter by staff member"
                    className="h-9 w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-[12.5px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-[160px]"
                  >
                    <option value="">All staff</option>
                    {staffOptions.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="relative flex-1 sm:flex-none">
                  <select
                    name="service"
                    defaultValue={serviceId ?? ""}
                    aria-label="Filter by service"
                    className="h-9 w-full appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-[12.5px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-[170px]"
                  >
                    <option value="">All services</option>
                    {serviceOptions.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-[10.5px] font-medium text-muted-foreground">
                From
                <Input
                  type="date"
                  name="from"
                  defaultValue={validFrom}
                  className="h-9 w-[150px] bg-background text-[12.5px]"
                />
              </label>
              <label className="flex flex-col gap-1 text-[10.5px] font-medium text-muted-foreground">
                To
                <Input
                  type="date"
                  name="to"
                  defaultValue={validTo}
                  className="h-9 w-[150px] bg-background text-[12.5px]"
                />
              </label>
              <Button type="submit" variant="secondary" size="sm" className="h-9 px-4">
                Apply filters
              </Button>
              {hasFilters ? (
                <Button asChild variant="ghost" size="sm" className="h-9 text-muted-foreground">
                  <Link href="/appointments">Clear all</Link>
                </Button>
              ) : null}
              <p className="ml-auto self-center text-[11px] tabular-nums text-muted-foreground">
                {result.total} {result.total === 1 ? "appointment" : "appointments"}
              </p>
            </div>
          </form>
        </div>

        {result.appointments.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={CalendarX2}
              title={hasFilters ? "No appointments match those filters" : "No appointments yet"}
              description={
                hasFilters
                  ? "Try widening the date range or clearing one of the filters."
                  : "Book your first appointment and it will appear here with its live status."
              }
              action={
                hasFilters ? (
                  <Button asChild variant="outline">
                    <Link href="/appointments">Clear filters</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/appointments/new">New appointment</Link>
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>When</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="w-16 text-right">
                      <span className="sr-only">View</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.appointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <Link
                          href={`/appointments/${appointment.id}`}
                          className="block text-[12.5px] font-medium hover:text-primary"
                        >
                          {formatZoned(appointment.start_at, settings.timezone, "EEE, MMM d")}
                        </Link>
                        <p className="text-[11px] tabular-nums text-muted-foreground">
                          {formatTime(appointment.start_at, settings.timezone)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <InitialsAvatar
                            name={appointment.customers?.full_name ?? "Customer"}
                            size="sm"
                          />
                          <Link
                            href={`/customers/${appointment.customer_id}`}
                            className="max-w-[180px] truncate text-[12.5px] font-medium hover:text-primary"
                          >
                            {appointment.customers?.full_name ?? "Customer"}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="text-[12px]">
                        {appointment.service_name_snapshot}
                      </TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">
                        {appointment.staff?.full_name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <AppointmentStatusBadge status={appointment.status} />
                      </TableCell>
                      <TableCell className="text-right text-[12.5px] font-medium tabular-nums">
                        {formatMoney(appointment.price_amount_snapshot, settings.currency_code)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/appointments/${appointment.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2.5 p-4 lg:hidden">
              {result.appointments.map((appointment) => (
                <Link
                  key={appointment.id}
                  href={`/appointments/${appointment.id}`}
                  className="block rounded-xl border border-border/80 bg-background/40 p-3.5 transition-colors hover:bg-muted/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <InitialsAvatar
                        name={appointment.customers?.full_name ?? "Customer"}
                        size="sm"
                      />
                      <div>
                        <p className="text-[13px] font-semibold">
                          {appointment.customers?.full_name ?? "Customer"}
                        </p>
                        <p className="text-[11px] tabular-nums text-muted-foreground">
                          {formatZoned(
                            appointment.start_at,
                            settings.timezone,
                            "EEE, MMM d",
                          )}{" "}
                          · {formatTime(appointment.start_at, settings.timezone)}
                        </p>
                      </div>
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                  <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5 text-[11.5px]">
                    <span className="truncate text-muted-foreground">
                      {appointment.service_name_snapshot}
                      {appointment.staff?.full_name
                        ? ` · ${appointment.staff.full_name}`
                        : ""}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {formatMoney(appointment.price_amount_snapshot, settings.currency_code)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="px-4 pb-4">
              <PaginationBar
                page={result.page}
                pageCount={result.pageCount}
                total={result.total}
                pageSize={result.pageSize}
                basePath="/appointments"
                params={filterParams}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
