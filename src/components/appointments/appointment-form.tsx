"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addMinutes } from "date-fns";
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Info,
  Loader2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { InitialsAvatar } from "@/components/app/avatar";
import { Field } from "@/components/app/field";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  createAppointmentAction,
  getAvailabilityAction,
  rescheduleAppointmentAction,
} from "@/lib/actions/appointments";
import type { AvailabilityResult } from "@/lib/data/availability";
import { formatDuration } from "@/lib/appointments/booking";
import {
  addDaysToKey,
  formatDateLong,
  formatMoney,
  formatTime,
  formatZoned,
  timeInputToMinutes,
  zonedNoon,
} from "@/lib/time";
import {
  bookingSchema,
  type BookingInput,
} from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

type CustomerOption = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
};

type StaffOption = { id: string; full_name: string };

type ServiceOption = {
  id: string;
  name: string;
  duration_minutes: number;
  price_amount: number;
};

export type AppointmentFormInitial = {
  appointmentId?: string;
  customer?: { id: string; full_name: string; email: string | null };
  customerId?: string;
  staffId?: string;
  serviceId?: string;
  dateKey: string;
  startAt?: string;
  notes?: string;
};

function pickerDateToKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function keyToPickerDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function AppointmentForm({
  mode,
  timezone,
  currencyCode,
  customers,
  staff,
  services,
  initial,
  todayKey,
}: {
  mode: "create" | "reschedule";
  timezone: string;
  currencyCode: string;
  customers: CustomerOption[];
  staff: StaffOption[];
  services: ServiceOption[];
  initial: AppointmentFormInitial;
  todayKey: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);
  const [dateOpen, setDateOpen] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResult | null>(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    setError,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerId: initial.customerId ?? "",
      staffId: initial.staffId ?? "",
      serviceId: initial.serviceId ?? "",
      date: initial.dateKey,
      startAt: initial.startAt ?? "",
      notes: initial.notes ?? "",
    },
  });

  const customerId = useWatch({ control, name: "customerId" });
  const staffId = useWatch({ control, name: "staffId" });
  const serviceId = useWatch({ control, name: "serviceId" });
  const dateKey = useWatch({ control, name: "date" });
  const startAt = useWatch({ control, name: "startAt" });

  const selectionSignature = `${customerId}|${staffId}|${serviceId}|${dateKey}`;
  const previousSelection = useRef(selectionSignature);

  useEffect(() => {
    if (previousSelection.current === selectionSignature) return;
    previousSelection.current = selectionSignature;
    setValue("startAt", "");
  }, [selectionSignature, setValue]);

  useEffect(() => {
    let cancelled = false;

    async function loadAvailability() {
      if (!staffId || !serviceId || !dateKey) {
        setAvailability(null);
        setAvailabilityLoading(false);
        setAvailabilityError(null);
        return;
      }

      setAvailabilityLoading(true);
      setAvailabilityError(null);

      const result = await getAvailabilityAction({
        staffId,
        serviceId,
        dateKey,
        appointmentId: mode === "reschedule" ? initial.appointmentId : undefined,
      });

      if (cancelled) return;

      setAvailabilityLoading(false);

      if (!result.ok) {
        setAvailability(null);
        setAvailabilityError(result.message);
        return;
      }

      setAvailability(result.data);
      const currentStart = getValues("startAt");
      const currentStartMs = currentStart ? new Date(currentStart).getTime() : null;
      const initialStartMs = initial.startAt
        ? new Date(initial.startAt).getTime()
        : null;

      if (
        currentStartMs !== null &&
        !result.data.slots.some(
          (slot) => new Date(slot.startAt).getTime() === currentStartMs,
        )
      ) {
        setValue("startAt", "", { shouldValidate: true });
      }

      if (
        mode === "reschedule" &&
        initialStartMs !== null &&
        initial.staffId === staffId &&
        initial.serviceId === serviceId &&
        initial.dateKey === dateKey &&
        !getValues("startAt") &&
        result.data.slots.some(
          (slot) => new Date(slot.startAt).getTime() === initialStartMs,
        )
      ) {
        setValue("startAt", new Date(initialStartMs).toISOString(), {
          shouldValidate: true,
        });
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [
    staffId,
    serviceId,
    dateKey,
    mode,
    initial.appointmentId,
    initial.startAt,
    initial.staffId,
    initial.serviceId,
    initial.dateKey,
    getValues,
    setValue,
  ]);

  const service = services.find((option) => option.id === serviceId);
  const staffMember = staff.find((option) => option.id === staffId);
  const selectedSlot = availability?.slots.find(
    (slot) =>
      Boolean(startAt) &&
      new Date(slot.startAt).getTime() === new Date(startAt).getTime(),
  );
  const effectiveService = availability?.service
    ? {
        name: availability.service.name,
        durationMinutes: availability.service.durationMinutes,
        priceAmount: availability.service.priceAmount,
      }
    : service
      ? {
          name: service.name,
          durationMinutes: service.duration_minutes,
          priceAmount: Number(service.price_amount),
        }
      : null;

  const endLabel = selectedSlot
    ? selectedSlot.endLabel
    : startAt && effectiveService
      ? formatTime(
          addMinutes(new Date(startAt), effectiveService.durationMinutes),
          timezone,
        )
      : null;

  const slotGroups = useMemo(() => {
    if (!availability) return [];
    const groups = [
      { label: "Morning", slots: [] as typeof availability.slots },
      { label: "Afternoon", slots: [] as typeof availability.slots },
      { label: "Evening", slots: [] as typeof availability.slots },
    ];

    for (const slot of availability.slots) {
      const minutes = timeInputToMinutes(slot.startTime) ?? 0;
      if (minutes < 12 * 60) groups[0]!.slots.push(slot);
      else if (minutes < 17 * 60) groups[1]!.slots.push(slot);
      else groups[2]!.slots.push(slot);
    }

    return groups.filter((group) => group.slots.length > 0);
  }, [availability]);

  function onSubmit(values: BookingInput) {
    setServerError(null);

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createAppointmentAction(values)
          : await rescheduleAppointmentAction({
              appointmentId: initial.appointmentId!,
              staffId: values.staffId,
              serviceId: values.serviceId,
              date: values.date,
              startAt: values.startAt,
              notes: values.notes,
            });

      if (!result.ok) {
        setServerError(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages[0] && field in values) {
              setError(field as keyof BookingInput, { message: messages[0] });
            }
          }
        }
        toast.error(result.message);
        return;
      }

      toast.success(
        mode === "create" ? "Appointment booked." : "Appointment updated.",
      );
      router.push(
        `/appointments/${result.data.id}?${mode === "create" ? "created=1" : "rescheduled=1"}`,
      );
      router.refresh();
    });
  }

  const customerForReschedule =
    initial.customer ??
    (customerId ? customers.find((option) => option.id === customerId) : undefined);

  const canSubmit =
    Boolean(customerId && staffId && serviceId && dateKey && startAt) && !pending;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div className="space-y-5">
        {serverError ? (
          <div
            role="alert"
            className="flex gap-2.5 rounded-xl border border-status-cancelled-border bg-status-cancelled-soft p-3.5 text-[13px] leading-relaxed text-status-cancelled"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{serverError}</p>
          </div>
        ) : null}

        <section className="rounded-2xl border border-border/80 bg-card shadow-card">
          <div className="border-b border-border/80 px-5 py-4">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.015em]">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                1
              </span>
              Who and what
            </h2>
            <p className="mt-1 pl-8 text-[12px] text-muted-foreground">
              Pick the customer, service, and staff member for this booking.
            </p>
          </div>

          <div className="space-y-5 p-5">
            {mode === "create" ? (
              <Field
                label="Customer"
                htmlFor="customerId"
                error={errors.customerId?.message}
                required
              >
                <Select
                  value={customerId}
                  onValueChange={(value) =>
                    setValue("customerId", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger
                    id="customerId"
                    className="w-full"
                    aria-invalid={Boolean(errors.customerId)}
                  >
                    <SelectValue placeholder="Choose a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        <span className="flex items-center gap-2">
                          <InitialsAvatar name={customer.full_name} size="sm" />
                          <span>
                            {customer.full_name}
                            {customer.email ? (
                              <span className="text-muted-foreground">
                                {" · "}
                                {customer.email}
                              </span>
                            ) : null}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ) : customerForReschedule ? (
              <div>
                <p className="mb-1.5 text-[13px] font-medium">Customer</p>
                <div className="flex items-center gap-3 rounded-xl border border-border/80 bg-muted/30 p-3">
                  <InitialsAvatar name={customerForReschedule.full_name} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium">
                      {customerForReschedule.full_name}
                    </p>
                    {customerForReschedule.email ? (
                      <p className="truncate text-[11px] text-muted-foreground">
                        {customerForReschedule.email}
                      </p>
                    ) : null}
                  </div>
                  <span className="ml-auto rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                    Fixed
                  </span>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Service"
                htmlFor="serviceId"
                error={errors.serviceId?.message}
                required
              >
                <Select
                  value={serviceId}
                  onValueChange={(value) =>
                    setValue("serviceId", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger
                    id="serviceId"
                    className="w-full"
                    aria-invalid={Boolean(errors.serviceId)}
                  >
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name} · {formatDuration(option.duration_minutes)} ·{" "}
                        {formatMoney(option.price_amount, currencyCode)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field
                label="Staff member"
                htmlFor="staffId"
                error={errors.staffId?.message}
                required
              >
                <Select
                  value={staffId}
                  onValueChange={(value) =>
                    setValue("staffId", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger
                    id="staffId"
                    className="w-full"
                    aria-invalid={Boolean(errors.staffId)}
                  >
                    <SelectValue placeholder="Choose a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-card shadow-card">
          <div className="border-b border-border/80 px-5 py-4">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.015em]">
              <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                2
              </span>
              When
            </h2>
            <p className="mt-1 pl-8 text-[12px] text-muted-foreground">
              Availability respects working hours, existing bookings, and time off.
            </p>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <p className="mb-1.5 text-[13px] font-medium">Date</p>
              <div className="flex flex-wrap items-center gap-2">
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 min-w-[210px] justify-start gap-2 font-normal"
                      aria-invalid={Boolean(errors.date)}
                    >
                      <CalendarDays className="size-4 text-muted-foreground" />
                      {dateKey
                        ? formatDateLong(zonedNoon(dateKey, timezone), timezone)
                        : "Choose a date"}
                      <ChevronDown className="ml-auto size-3.5 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateKey ? keyToPickerDate(dateKey) : undefined}
                      onSelect={(nextDate) => {
                        if (!nextDate) return;
                        setValue("date", pickerDateToKey(nextDate), {
                          shouldValidate: true,
                        });
                        setDateOpen(false);
                      }}
                      disabled={{ before: keyToPickerDate(todayKey) }}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  type="button"
                  variant={dateKey === todayKey ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() =>
                    setValue("date", todayKey, { shouldValidate: true })
                  }
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant={
                    dateKey === addDaysToKey(todayKey, 1, timezone)
                      ? "secondary"
                      : "ghost"
                  }
                  size="sm"
                  onClick={() =>
                    setValue("date", addDaysToKey(todayKey, 1, timezone), {
                      shouldValidate: true,
                    })
                  }
                >
                  Tomorrow
                </Button>
              </div>
              {errors.date?.message ? (
                <p role="alert" className="mt-1.5 text-xs font-medium text-destructive">
                  {errors.date.message}
                </p>
              ) : null}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[13px] font-medium">
                  Available times
                  {availability?.timeZone ? (
                    <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                      {availability.timeZone}
                    </span>
                  ) : null}
                </p>
                {availability && availability.slots.length > 0 ? (
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {availability.slots.length} slots
                  </span>
                ) : null}
              </div>

              {!staffId || !serviceId ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/25 px-4 py-6 text-center text-[12.5px] text-muted-foreground">
                  Choose a service and staff member to see open times.
                </div>
              ) : availabilityLoading ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <Skeleton key={index} className="h-9 rounded-lg" />
                  ))}
                </div>
              ) : availabilityError ? (
                <div className="flex gap-2 rounded-xl border border-status-pending-border bg-status-pending-soft p-3 text-[12px] text-status-pending">
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                  {availabilityError}
                </div>
              ) : availability && availability.slots.length === 0 ? (
                <div className="flex gap-2 rounded-xl border border-border bg-muted/25 p-3 text-[12px] leading-relaxed text-muted-foreground">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  {availability.reason ?? "No open times on this day."}
                </div>
              ) : availability ? (
                <div className="space-y-4">
                  {slotGroups.map((group) => (
                    <div key={group.label}>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        {group.label}
                      </p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-5">
                        {group.slots.map((slot) => {
                          const selected = startAt === slot.startAt;
                          return (
                            <button
                              key={slot.startAt}
                              type="button"
                              onClick={() =>
                                setValue("startAt", slot.startAt, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                })
                              }
                              className={cn(
                                "flex h-9 items-center justify-center gap-1 rounded-lg border text-[11.5px] font-medium tabular-nums transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                selected
                                  ? "border-primary bg-primary text-white shadow-sm"
                                  : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/60",
                              )}
                              aria-pressed={selected}
                            >
                              {selected ? <Check className="size-3" /> : null}
                              {slot.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {errors.startAt?.message ? (
                <p role="alert" className="mt-2 text-xs font-medium text-destructive">
                  {errors.startAt.message}
                </p>
              ) : null}
            </div>

            <Field label="Notes" htmlFor="appointment-notes" error={errors.notes?.message}>
              <Textarea
                id="appointment-notes"
                placeholder="Optional notes for this booking."
                rows={3}
                aria-invalid={Boolean(errors.notes)}
                {...register("notes")}
              />
            </Field>
          </div>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-24">
        <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
          <div className="border-b border-border/80 px-5 py-4">
            <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
              Booking summary
            </h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Everything is revalidated when you confirm.
            </p>
          </div>

          <div className="space-y-3.5 p-5 text-[12.5px]">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Service</span>
              <span className="text-right font-medium">
                {effectiveService?.name ?? "Not selected"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Staff</span>
              <span className="text-right font-medium">
                {staffMember?.full_name ?? availability?.staffName ?? "Not selected"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Date</span>
              <span className="text-right font-medium">
                {dateKey
                  ? formatZoned(zonedNoon(dateKey, timezone), timezone, "EEE, MMM d, yyyy")
                  : "Not selected"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Time</span>
              <span className="text-right font-medium tabular-nums">
                {startAt && endLabel
                  ? `${formatTime(startAt, timezone)} – ${endLabel}`
                  : "Select a slot"}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Duration</span>
              <span className="text-right font-medium">
                {effectiveService ? formatDuration(effectiveService.durationMinutes) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3.5">
              <span className="text-muted-foreground">Price</span>
              <span className="text-[17px] font-semibold tabular-nums">
                {effectiveService
                  ? formatMoney(effectiveService.priceAmount, currencyCode)
                  : "—"}
              </span>
            </div>
          </div>

          <div className="border-t border-border/80 bg-muted/20 p-4">
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-10 w-full gap-2"
              size="lg"
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : null}
              {pending
                ? "Saving…"
                : mode === "create"
                  ? "Confirm booking"
                  : "Save changes"}
            </Button>
            <p className="mt-2 text-center text-[10.5px] text-muted-foreground">
              Conflict-safe — the database will reject a double booking.
            </p>
          </div>
        </section>

        <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 text-[11.5px] leading-relaxed text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <Clock3 className="size-3.5 text-primary" />
            Business time zone
          </div>
          <p className="mt-1.5">
            {timezone}. Local times are converted to exact instants before saving, so
            daylight-saving changes are handled correctly.
          </p>
        </div>

        {mode === "reschedule" && initial.customer ? (
          <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card p-4 text-[11.5px] text-muted-foreground">
            <UserRound className="size-4 shrink-0 text-primary" />
            Rescheduling preserves the customer and appends an event to the appointment
            timeline.
          </div>
        ) : null}
      </aside>
    </form>
  );
}
