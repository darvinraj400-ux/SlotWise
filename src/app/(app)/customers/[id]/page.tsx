import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Banknote,
  CalendarCheck2,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Mail,
  NotebookText,
  Phone,
  UserRound,
} from "lucide-react";
import { ActiveBadge, StatusBadge } from "@/components/app/status-badge";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { StatCard } from "@/components/app/stat-card";
import { InitialsAvatar } from "@/components/app/avatar";
import { CustomerDetailActions } from "@/components/customers/customer-detail-actions";
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
  getCustomerAppointments,
  getCustomerById,
  getCustomerStats,
} from "@/lib/data/customers";
import { formatMoney, formatTime, formatZoned } from "@/lib/time";
import { isAppointmentStatus } from "@/lib/appointments/status";
import { uuidSchema } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Customer" };

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const { supabase, user, settings } = await requireSession();

  const [customer, appointments, stats] = await Promise.all([
    getCustomerById(supabase, user.id, id),
    getCustomerAppointments(supabase, user.id, id),
    getCustomerStats(supabase, user.id, id),
  ]);

  if (!customer) notFound();

  const contactLine = [customer.email, customer.phone].filter(Boolean).join(" · ");

  return (
    <div>
      <Link
        href="/customers"
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All customers
      </Link>

      <PageHeader
        eyebrow="Customer"
        title={customer.full_name}
        badge={
          <ActiveBadge
            isActive={customer.is_active}
            activeLabel="Active"
            inactiveLabel="Archived"
          />
        }
        description={contactLine || "No contact details recorded yet."}
        actions={<CustomerDetailActions customer={customer} />}
      />

      <div className="grid grid-cols-1 gap-3 min-[430px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Appointments"
          value={stats.total}
          icon={CalendarCheck2}
          hint="All time"
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle2}
          accent="teal"
          hint="Visits recorded"
        />
        <StatCard
          label="Revenue"
          value={formatMoney(stats.revenue, settings.currency_code)}
          icon={Banknote}
          accent="indigo"
          hint="From completed visits"
        />
        <StatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={Clock3}
          accent="amber"
          hint="Current active bookings"
        />
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
          <div className="flex items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                Appointment history
              </h2>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Newest first, in {settings.timezone}
              </p>
            </div>
            {customer.is_active ? (
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <Link href={`/appointments/new?customerId=${customer.id}`}>
                  <CalendarPlus className="size-3.5" />
                  New
                </Link>
              </Button>
            ) : null}
          </div>

          {appointments.length === 0 ? (
            <div className="p-4 sm:p-6">
              <EmptyState
                compact
                icon={CalendarCheck2}
                title="No appointments yet"
                description="Book their first visit and it will appear here with the service snapshot and status."
                action={
                  customer.is_active ? (
                    <Button asChild>
                      <Link href={`/appointments/new?customerId=${customer.id}`}>
                        Book an appointment
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>When</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((appointment) => (
                      <TableRow key={appointment.id}>
                        <TableCell>
                          <Link
                            href={`/appointments/${appointment.id}`}
                            className="block text-[12.5px] font-medium hover:text-primary"
                          >
                            {formatZoned(appointment.start_at, settings.timezone, "MMM d, yyyy")}
                          </Link>
                          <p className="text-[11px] tabular-nums text-muted-foreground">
                            {formatTime(appointment.start_at, settings.timezone)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-[12.5px]">{appointment.service_name_snapshot}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {appointment.duration_minutes_snapshot} min
                          </p>
                        </TableCell>
                        <TableCell className="text-[12.5px] text-muted-foreground">
                          {appointment.staff?.full_name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {isAppointmentStatus(appointment.status) ? (
                            <StatusBadge status={appointment.status} />
                          ) : (
                            <span>{appointment.status}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-[12.5px] font-medium tabular-nums">
                          {formatMoney(appointment.price_amount_snapshot, settings.currency_code)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-2.5 p-4 sm:hidden">
                {appointments.map((appointment) => (
                  <Link
                    key={appointment.id}
                    href={`/appointments/${appointment.id}`}
                    className="block rounded-xl border border-border/80 p-3.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-semibold">
                          {formatZoned(appointment.start_at, settings.timezone, "EEE, MMM d")}
                          <span className="ml-1.5 font-normal text-muted-foreground">
                            {formatTime(appointment.start_at, settings.timezone)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[12px] wrap-anywhere">
                          {appointment.service_name_snapshot}
                        </p>
                        <p className="mt-0.5 text-[11px] wrap-anywhere text-muted-foreground">
                          {appointment.staff?.full_name ?? "Unassigned"}
                        </p>
                      </div>
                      {isAppointmentStatus(appointment.status) ? (
                        <StatusBadge status={appointment.status} />
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>

              {stats.total > appointments.length ? (
                <p className="border-t border-border/70 px-5 py-3 text-[11px] text-muted-foreground">
                  Showing the most recent {appointments.length} of {stats.total} appointments.
                  Use the reports page for the complete range.
                </p>
              ) : null}
            </>
          )}
        </section>

        <aside className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
            <div className="flex items-center gap-3">
              <InitialsAvatar name={customer.full_name} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-semibold">{customer.full_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Customer since{" "}
                  {formatZoned(customer.created_at, settings.timezone, "MMM yyyy")}
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-3 border-t border-border/70 pt-4">
              <div className="flex items-start gap-2.5">
                <Mail className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <dt className="sr-only">Email</dt>
                  <dd className="break-all text-[12.5px]">
                    {customer.email ? (
                      <a href={`mailto:${customer.email}`} className="hover:text-primary">
                        {customer.email}
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
                    {customer.phone ? (
                      <a href={`tel:${customer.phone}`} className="hover:text-primary">
                        {customer.phone}
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
              <p className="mt-1.5 whitespace-pre-line text-[12.5px] leading-relaxed text-foreground/90">
                {customer.notes || "No notes yet."}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-border/80 bg-muted/35 p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold">
              <UserRound className="size-4 text-primary" />
              Customer context
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              Snapshots on each appointment preserve the service name and price from
              the time of booking. Editing a service later will not rewrite this
              history.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
