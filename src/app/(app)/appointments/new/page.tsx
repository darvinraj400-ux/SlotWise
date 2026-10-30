import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Circle,
  Scissors,
  Users,
} from "lucide-react";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/context";
import { getCustomerOptions } from "@/lib/data/customers";
import { getServiceOptions } from "@/lib/data/services";
import { getStaffOptions } from "@/lib/data/staff";
import { firstParam } from "@/lib/data/helpers";
import { parseDateKey, todayDateKey } from "@/lib/time";

export const metadata: Metadata = { title: "New appointment" };

function SetupStep({
  done,
  title,
  description,
  href,
  icon: Icon,
}: {
  done: boolean;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4">
      <span
        className={
          done
            ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-status-completed-soft text-status-completed"
            : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
        }
      >
        {done ? (
          <CheckCircle2 className="size-4" />
        ) : (
          <Circle className="size-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {!done ? (
        <Button asChild variant="outline" size="sm" className="shrink-0">
          <Link href={href}>Set up</Link>
        </Button>
      ) : (
        <Icon className="mt-1 size-4 shrink-0 text-muted-foreground/50" />
      )}
    </div>
  );
}

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, user, settings } = await requireSession();

  const [customers, staff, services] = await Promise.all([
    getCustomerOptions(supabase, user.id, true),
    getStaffOptions(supabase, user.id, true),
    getServiceOptions(supabase, user.id, true),
  ]);

  const todayKey = todayDateKey(settings.timezone);
  const requestedDate = firstParam(params.date);
  const dateKey = parseDateKey(requestedDate) ? requestedDate! : todayKey;
  const requestedCustomer = firstParam(params.customerId);
  const requestedStaff = firstParam(params.staffId);
  const requestedService = firstParam(params.serviceId);

  const ready = customers.length > 0 && staff.length > 0 && services.length > 0;

  return (
    <div>
      <Link
        href="/appointments"
        className="mb-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All appointments
      </Link>

      <PageHeader
        eyebrow="Scheduling"
        title="New appointment"
        description="Choose the customer and service, then pick a verified open slot."
      />

      {!ready ? (
        <div className="max-w-2xl">
          <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
            <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
              A few things before your first booking
            </h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              SlotWise needs at least one active customer, service, and staff member.
              Working hours are also required for availability.
            </p>

            <div className="mt-4 space-y-2.5">
              <SetupStep
                done={services.length > 0}
                title="Add your services"
                description="Duration and price are captured on every booking."
                href="/services"
                icon={Scissors}
              />
              <SetupStep
                done={staff.length > 0}
                title="Add your staff"
                description="Staff are the scheduling resources for appointments."
                href="/staff"
                icon={BadgeCheck}
              />
              <SetupStep
                done={customers.length > 0}
                title="Add a customer"
                description="Every appointment belongs to a customer record."
                href="/customers"
                icon={Users}
              />
            </div>

            <div className="mt-4 rounded-xl border border-border/70 bg-muted/35 p-3.5 text-[11.5px] leading-relaxed text-muted-foreground">
              Don&apos;t forget to set each staff member&apos;s weekly working hours
              and any time off. The booking form will only show genuinely open slots.
            </div>

            {ready ? null : (
              <div className="mt-4 flex flex-wrap gap-2">
                {services.length === 0 ? (
                  <Button asChild size="sm" className="gap-1.5">
                    <Link href="/services">
                      Add services
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                ) : null}
                {staff.length === 0 ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/staff">Add staff</Link>
                  </Button>
                ) : null}
                {customers.length === 0 ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/customers">Add customer</Link>
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : (
        <AppointmentForm
          mode="create"
          timezone={settings.timezone}
          currencyCode={settings.currency_code}
          customers={customers}
          staff={staff.map((member) => ({ id: member.id, full_name: member.full_name }))}
          services={services.map((service) => ({
            id: service.id,
            name: service.name,
            duration_minutes: service.duration_minutes,
            price_amount: Number(service.price_amount),
          }))}
          todayKey={todayKey}
          initial={{
            customerId: customers.some((customer) => customer.id === requestedCustomer)
              ? requestedCustomer
              : undefined,
            staffId: staff.some((member) => member.id === requestedStaff)
              ? requestedStaff
              : undefined,
            serviceId: services.some((service) => service.id === requestedService)
              ? requestedService
              : undefined,
            dateKey,
          }}
        />
      )}
    </div>
  );
}
