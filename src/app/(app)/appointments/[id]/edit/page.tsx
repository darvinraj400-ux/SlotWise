import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarX2 } from "lucide-react";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { PageHeader } from "@/components/app/page-header";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/context";
import { getAppointmentById } from "@/lib/data/appointments";
import { getServiceOptions } from "@/lib/data/services";
import { getStaffOptions } from "@/lib/data/staff";
import { isAppointmentStatus } from "@/lib/appointments/status";
import { uuidSchema } from "@/lib/validation/schemas";
import {
  formatDateLong,
  formatTime,
  toDateInputValue,
  todayDateKey,
} from "@/lib/time";

export const metadata: Metadata = { title: "Reschedule appointment" };

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();
  const { supabase, user, settings } = await requireSession();

  const [appointment, staff, services] = await Promise.all([
    getAppointmentById(supabase, user.id, id),
    getStaffOptions(supabase, user.id, true),
    getServiceOptions(supabase, user.id, true),
  ]);

  if (!appointment) notFound();

  const reschedulable =
    appointment.status === "pending" || appointment.status === "confirmed";

  const dateKey = toDateInputValue(appointment.start_at, settings.timezone);
  const activeStaff = staff.find((member) => member.id === appointment.staff_id);
  const activeService = services.find(
    (service) => service.id === appointment.service_id,
  );

  return (
    <div>
      <Link
        href={`/appointments/${appointment.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to appointment
      </Link>

      <PageHeader
        eyebrow="Scheduling"
        title="Reschedule appointment"
        badge={
          isAppointmentStatus(appointment.status) ? (
            <StatusBadge status={appointment.status} />
          ) : null
        }
        description={`${appointment.customers?.full_name ?? "Customer"} · ${formatDateLong(
          appointment.start_at,
          settings.timezone,
        )} at ${formatTime(appointment.start_at, settings.timezone)}`}
      />

      {!reschedulable ? (
        <div className="max-w-xl rounded-2xl border border-border/80 bg-card p-6 shadow-card">
          <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <CalendarX2 className="size-5" />
          </span>
          <h2 className="mt-4 text-[15px] font-semibold">
            This appointment can no longer be rescheduled
          </h2>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            Only pending or confirmed appointments can move. This booking is already{" "}
            {appointment.status.replace("_", " ")}. If you need another visit, create a
            new appointment deliberately.
          </p>
          <div className="mt-5 flex gap-2">
            <Button asChild>
              <Link href={`/appointments/${appointment.id}`}>View appointment</Link>
            </Button>
            <Button asChild variant="outline">
              <Link
                href={`/appointments/new?customerId=${appointment.customer_id}&serviceId=${appointment.service_id}`}
              >
                Book another
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {!activeStaff || !activeService ? (
            <div className="mb-5 rounded-xl border border-status-pending-border bg-status-pending-soft p-3.5 text-[12.5px] leading-relaxed text-status-pending">
              The current staff member or service is inactive. Choose an active option
              below to reschedule — the customer stays the same.
            </div>
          ) : null}

          <AppointmentForm
            mode="reschedule"
            timezone={settings.timezone}
            currencyCode={settings.currency_code}
            customers={[]}
            staff={staff.map((member) => ({
              id: member.id,
              full_name: member.full_name,
            }))}
            services={services.map((service) => ({
              id: service.id,
              name: service.name,
              duration_minutes: service.duration_minutes,
              price_amount: Number(service.price_amount),
            }))}
            todayKey={todayDateKey(settings.timezone)}
            initial={{
              appointmentId: appointment.id,
              customer: appointment.customers
                ? {
                    id: appointment.customers.id,
                    full_name: appointment.customers.full_name,
                    email: appointment.customers.email,
                  }
                : undefined,
              customerId: appointment.customer_id,
              staffId: activeStaff?.id,
              serviceId: activeService?.id,
              dateKey,
              startAt: new Date(appointment.start_at).toISOString(),
              notes: appointment.notes ?? "",
            }}
          />
        </>
      )}
    </div>
  );
}
