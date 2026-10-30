import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AutoFilterSelect } from "@/components/app/auto-filter-select";
import { Button } from "@/components/ui/button";
import { STATUS_META, APPOINTMENT_STATUSES } from "@/lib/appointments/status";
import { cn } from "@/lib/utils";

type CalendarView = "day" | "week" | "month";

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export function CalendarToolbar({
  view,
  label,
  staffId,
  staffOptions,
  viewHrefs,
  previousHref,
  nextHref,
  todayHref,
}: {
  view: CalendarView;
  label: string;
  staffId: string | undefined;
  staffOptions: { id: string; full_name: string; is_active: boolean }[];
  viewHrefs: Record<CalendarView, string>;
  previousHref: string;
  nextHref: string;
  todayHref: string;
}) {
  return (
    <div>
      <div className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-border/80 bg-background">
            <Button asChild variant="ghost" size="icon-sm" aria-label="Previous period">
              <Link href={previousHref}>
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <Link
              href={todayHref}
              className="border-x border-border/80 px-2.5 py-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Today
            </Link>
            <Button asChild variant="ghost" size="icon-sm" aria-label="Next period">
              <Link href={nextHref}>
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
          <h2 className="min-w-0 truncate text-[15px] font-semibold tracking-[-0.02em]">
            {label}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center rounded-lg border border-border/80 bg-muted/40 p-0.5"
            role="group"
            aria-label="Calendar view"
          >
            {VIEWS.map((item) => (
              <Link
                key={item.value}
                href={viewHrefs[item.value]}
                aria-current={view === item.value ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors",
                  view === item.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <AutoFilterSelect
            paramKey="staff"
            value={staffId}
            placeholder="Filter staff"
            allLabel="All staff"
            options={staffOptions.map((member) => ({
              value: member.id,
              label: member.is_active ? member.full_name : `${member.full_name} (inactive)`,
            }))}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border/60 bg-muted/15 px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Status
        </span>
        {APPOINTMENT_STATUSES.map((status) => (
          <span
            key={status}
            className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground"
          >
            <span
              className={cn("size-1.5 rounded-full", STATUS_META[status].dotClass)}
              aria-hidden
            />
            {STATUS_META[status].label}
          </span>
        ))}
      </div>
    </div>
  );
}
