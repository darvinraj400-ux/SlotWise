"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CalendarOff, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/app/confirm-action-dialog";
import { EmptyState } from "@/components/app/empty-state";
import { Field } from "@/components/app/field";
import { FormDialog } from "@/components/app/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createTimeOffAction,
  deleteTimeOffAction,
} from "@/lib/actions/staff";
import { formatTime, formatZoned } from "@/lib/time";
import type { StaffTimeOff } from "@/lib/types";
import { cn } from "@/lib/utils";

type TimeOffErrors = Partial<
  Record<"startDate" | "startTime" | "endDate" | "endTime" | "reason", string>
>;

function timeOffStatus(entry: StaffTimeOff, now: Date) {
  const start = new Date(entry.starts_at);
  const end = new Date(entry.ends_at);
  if (end.getTime() < now.getTime()) return "past" as const;
  if (start.getTime() <= now.getTime()) return "current" as const;
  return "upcoming" as const;
}

const STATUS_STYLES = {
  upcoming:
    "border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed",
  current:
    "border-status-pending-border bg-status-pending-soft text-status-pending",
  past: "border-border bg-muted/60 text-muted-foreground",
} as const;

export function TimeOffSection({
  staffId,
  staffName,
  entries,
  timezone,
  defaultDate,
  defaultEndDate,
  nowIso,
}: {
  staffId: string;
  staffName: string;
  entries: StaffTimeOff[];
  timezone: string;
  defaultDate: string;
  defaultEndDate: string;
  nowIso: string;
}) {
  const router = useRouter();
  const now = new Date(nowIso);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<TimeOffErrors>({});
  const [form, setForm] = useState({
    startDate: defaultDate,
    startTime: "09:00",
    endDate: defaultEndDate,
    endTime: "10:00",
    reason: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<StaffTimeOff | null>(null);

  const sorted = [...entries].sort((a, b) => {
    const aPast = timeOffStatus(a, now) === "past";
    const bPast = timeOffStatus(b, now) === "past";
    if (aPast !== bPast) return aPast ? 1 : -1;
    const aTime = new Date(a.starts_at).getTime();
    const bTime = new Date(b.starts_at).getTime();
    return aPast ? bTime - aTime : aTime - bTime;
  });

  function openDialog() {
    setForm({
      startDate: defaultDate,
      startTime: "09:00",
      endDate: defaultEndDate,
      endTime: "10:00",
      reason: "",
    });
    setFieldErrors({});
    setGeneralError(null);
    setOpen(true);
  }

  function handleCreate() {
    setFieldErrors({});
    setGeneralError(null);

    startTransition(async () => {
      const result = await createTimeOffAction(staffId, {
        startDate: form.startDate,
        startTime: form.startTime,
        endDate: form.endDate,
        endTime: form.endTime,
        reason: form.reason,
      });

      if (!result.ok) {
        setGeneralError(result.message);
        if (result.fieldErrors) {
          const nextErrors: TimeOffErrors = {};
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            if (messages[0] && key in form) {
              nextErrors[key as keyof TimeOffErrors] = messages[0];
            }
          }
          setFieldErrors(nextErrors);
        }
        toast.error(result.message);
        return;
      }

      toast.success("Time off recorded.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold tracking-[-0.015em]">Time off</h2>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Blocked windows never appear as bookable slots.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={openDialog} className="gap-1.5">
          <Plus className="size-3.5" />
          Add time off
        </Button>
      </div>

      {sorted.length === 0 ? (
        <div className="p-4">
          <EmptyState
            compact
            icon={CalendarOff}
            title="No time off recorded"
            description="Add holidays, breaks, or personal time so bookings steer clear."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border/60">
          {sorted.map((entry) => {
            const status = timeOffStatus(entry, now);
            return (
              <li key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
                    STATUS_STYLES[status],
                  )}
                >
                  <CalendarOff className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[12.5px] font-medium">
                      {formatZoned(entry.starts_at, timezone, "EEE, MMM d, yyyy")}
                    </p>
                    <span
                      className={cn(
                        "rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.06em]",
                        STATUS_STYLES[status],
                      )}
                    >
                      {status === "upcoming"
                        ? "Upcoming"
                        : status === "current"
                          ? "In effect"
                          : "Past"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11.5px] tabular-nums text-muted-foreground">
                    {formatTime(entry.starts_at, timezone)} –{" "}
                    {formatZoned(entry.starts_at, timezone, "yyyy-MM-dd") ===
                    formatZoned(entry.ends_at, timezone, "yyyy-MM-dd")
                      ? formatTime(entry.ends_at, timezone)
                      : `${formatZoned(entry.ends_at, timezone, "EEE, MMM d")} · ${formatTime(
                          entry.ends_at,
                          timezone,
                        )}`}
                  </p>
                  {entry.reason ? (
                    <p className="mt-1 text-[11.5px] text-muted-foreground">{entry.reason}</p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(entry)}
                  aria-label={`Delete time off starting ${formatZoned(
                    entry.starts_at,
                    timezone,
                    "MMM d, yyyy",
                  )}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <FormDialog
        open={open}
        onOpenChange={(next) => {
          if (!pending) setOpen(next);
        }}
        title={`Record time off for ${staffName}`}
        description="Time off is stored as an exact instant using your business time zone."
      >
        <div className="space-y-4">
          {generalError ? (
            <div
              role="alert"
              className="flex gap-2.5 rounded-xl border border-status-cancelled-border bg-status-cancelled-soft p-3 text-[12.5px] text-status-cancelled"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{generalError}</p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
            <Field label="Starts on" htmlFor="timeoff-start-date" error={fieldErrors.startDate} required>
              <Input
                id="timeoff-start-date"
                type="date"
                value={form.startDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startDate: event.target.value }))
                }
                aria-invalid={Boolean(fieldErrors.startDate)}
              />
            </Field>
            <Field label="At" htmlFor="timeoff-start-time" error={fieldErrors.startTime} required>
              <Input
                id="timeoff-start-time"
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, startTime: event.target.value }))
                }
                aria-invalid={Boolean(fieldErrors.startTime)}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_130px]">
            <Field label="Ends on" htmlFor="timeoff-end-date" error={fieldErrors.endDate} required>
              <Input
                id="timeoff-end-date"
                type="date"
                value={form.endDate}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endDate: event.target.value }))
                }
                aria-invalid={Boolean(fieldErrors.endDate)}
              />
            </Field>
            <Field label="At" htmlFor="timeoff-end-time" error={fieldErrors.endTime} required>
              <Input
                id="timeoff-end-time"
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  setForm((current) => ({ ...current, endTime: event.target.value }))
                }
                aria-invalid={Boolean(fieldErrors.endTime)}
              />
            </Field>
          </div>

          <Field label="Reason" htmlFor="timeoff-reason" error={fieldErrors.reason}>
            <Textarea
              id="timeoff-reason"
              value={form.reason}
              onChange={(event) =>
                setForm((current) => ({ ...current, reason: event.target.value }))
              }
              placeholder="Optional — e.g. annual leave, training day."
              rows={2}
            />
          </Field>

          <div className="flex justify-end gap-2 border-t border-border/80 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={pending} className="gap-1.5">
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
              {pending ? "Saving…" : "Record time off"}
            </Button>
          </div>
        </div>
      </FormDialog>

      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
        title="Delete this time off?"
        description="The blocked window will be removed and may become bookable again."
        confirmLabel="Delete time off"
        successMessage="Time off deleted."
        destructive
        onConfirm={async () => {
          if (!deleteTarget) return { ok: false, message: "Nothing selected." };
          return deleteTimeOffAction(deleteTarget.id, staffId);
        }}
      />
    </section>
  );
}
