"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveStaffScheduleAction } from "@/lib/actions/staff";
import { WEEKDAY_LABELS, timeInputToMinutes } from "@/lib/time";
import type { StaffWorkingHours } from "@/lib/types";
import { formatDuration } from "@/lib/appointments/booking";
import { cn } from "@/lib/utils";

type DayState = {
  weekday: number;
  label: string;
  short: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
};

function buildDays(schedule: StaffWorkingHours[]): DayState[] {
  return WEEKDAY_LABELS.map((day) => {
    const existing = schedule.find((entry) => entry.weekday === day.weekday);
    return {
      weekday: day.weekday,
      label: day.label,
      short: day.short,
      enabled: Boolean(existing),
      startTime: existing ? existing.start_time.slice(0, 5) : "09:00",
      endTime: existing ? existing.end_time.slice(0, 5) : "17:00",
    };
  });
}

export function WorkingHoursEditor({
  staffId,
  schedule,
  isActive,
}: {
  staffId: string;
  schedule: StaffWorkingHours[];
  isActive: boolean;
}) {
  const [days, setDays] = useState<DayState[]>(() => buildDays(schedule));
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const dayErrors = days.map((day) => {
    if (!day.enabled) return null;
    const start = timeInputToMinutes(day.startTime);
    const end = timeInputToMinutes(day.endTime);
    if (start === null || end === null) return "Add both times.";
    if (end <= start) return "End time must be after start time.";
    return null;
  });

  const hasErrors = dayErrors.some(Boolean);

  const totalMinutes = days.reduce((sum, day) => {
    if (!day.enabled) return sum;
    const start = timeInputToMinutes(day.startTime);
    const end = timeInputToMinutes(day.endTime);
    if (start === null || end === null || end <= start) return sum;
    return sum + (end - start);
  }, 0);

  const activeDays = days.filter((day) => day.enabled).length;

  function updateDay(weekday: number, patch: Partial<DayState>) {
    setDays((current) =>
      current.map((day) => (day.weekday === weekday ? { ...day, ...patch } : day)),
    );
  }

  function handleSave() {
    if (hasErrors) {
      toast.error("Fix the highlighted working hours first.");
      return;
    }

    startTransition(async () => {
      const result = await saveStaffScheduleAction(
        staffId,
        days.map((day) => ({
          weekday: day.weekday,
          startTime: day.startTime,
          endTime: day.endTime,
          enabled: day.enabled,
        })),
      );

      if (!result.ok) {
        toast.error(result.message);
        return;
      }

      toast.success("Working hours saved.");
      router.refresh();
    });
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
      <div className="border-b border-border/80 px-5 py-4">
        <h2 className="text-[15px] font-semibold tracking-[-0.015em]">Working hours</h2>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          One interval per weekday. Availability is built from these hours.
        </p>
      </div>

      <div className="divide-y divide-border/60">
        {days.map((day, index) => {
          const error = dayErrors[index];
          return (
            <div
              key={day.weekday}
              className={cn(
                "px-5 py-3 transition-colors",
                day.enabled ? "" : "bg-muted/15",
              )}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex w-[72px] shrink-0 items-center gap-2">
                  <Switch
                    checked={day.enabled}
                    onCheckedChange={(checked) =>
                      updateDay(day.weekday, { enabled: checked })
                    }
                    disabled={pending}
                    aria-label={`${day.enabled ? "Disable" : "Enable"} ${day.label}`}
                  />
                  <span
                    className={cn(
                      "text-[12.5px] font-medium",
                      day.enabled ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {day.short}
                  </span>
                </div>

                <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:flex-1">
                  <Input
                    type="time"
                    value={day.startTime}
                    onChange={(event) =>
                      updateDay(day.weekday, { startTime: event.target.value })
                    }
                    disabled={!day.enabled || pending}
                    aria-label={`${day.label} start time`}
                    className="h-8 w-full min-w-0 flex-1 bg-background text-[12px] tabular-nums disabled:opacity-45 sm:max-w-[126px]"
                  />
                  <span className="text-[11px] text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={day.endTime}
                    onChange={(event) =>
                      updateDay(day.weekday, { endTime: event.target.value })
                    }
                    disabled={!day.enabled || pending}
                    aria-label={`${day.label} end time`}
                    aria-invalid={Boolean(error)}
                    className="h-8 w-full min-w-0 flex-1 bg-background text-[12px] tabular-nums disabled:opacity-45 sm:max-w-[126px]"
                  />
                </div>
              </div>
              {error ? (
                <p role="alert" className="mt-1.5 pl-[84px] text-[11px] font-medium text-destructive">
                  {error}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-t border-border/80 bg-muted/25 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground">{activeDays}</span>{" "}
          {activeDays === 1 ? "day" : "days"} ·{" "}
          <span className="font-medium text-foreground">
            {formatDuration(totalMinutes)}
          </span>{" "}
          per week
          {!isActive ? " · inactive staff are not bookable" : ""}
        </p>
        <Button onClick={handleSave} disabled={pending || hasErrors} className="gap-1.5" size="sm">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {pending ? "Saving…" : "Save hours"}
        </Button>
      </div>
    </section>
  );
}
