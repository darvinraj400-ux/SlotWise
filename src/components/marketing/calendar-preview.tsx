import { ShieldCheck } from "lucide-react";

type PreviewTone = "pending" | "confirmed" | "in-progress" | "completed" | "cancelled";

type PreviewAppointment = {
  start: number;
  duration: number;
  service: string;
  client: string;
  tone: PreviewTone;
};

type PreviewDay = {
  day: string;
  date: string;
  today?: boolean;
  appointments: PreviewAppointment[];
};

const DAYS: PreviewDay[] = [
  {
    day: "Mon",
    date: "20",
    appointments: [
      {
        start: 570,
        duration: 60,
        service: "Cut & finish",
        client: "Amara S.",
        tone: "confirmed",
      },
      {
        start: 780,
        duration: 90,
        service: "Colour retouch",
        client: "Nadia R.",
        tone: "pending",
      },
    ],
  },
  {
    day: "Tue",
    date: "21",
    today: true,
    appointments: [
      {
        start: 600,
        duration: 60,
        service: "Beard sculpt",
        client: "Marcus T.",
        tone: "in-progress",
      },
      {
        start: 690,
        duration: 60,
        service: "Cut & finish",
        client: "Ilya K.",
        tone: "confirmed",
      },
      {
        start: 840,
        duration: 60,
        service: "Scalp ritual",
        client: "June W.",
        tone: "completed",
      },
    ],
  },
  {
    day: "Wed",
    date: "22",
    appointments: [
      {
        start: 570,
        duration: 90,
        service: "Colour retouch",
        client: "Hana M.",
        tone: "confirmed",
      },
      {
        start: 750,
        duration: 60,
        service: "Cut & finish",
        client: "Dev P.",
        tone: "pending",
      },
    ],
  },
  {
    day: "Thu",
    date: "23",
    appointments: [
      {
        start: 630,
        duration: 60,
        service: "Beard sculpt",
        client: "Owen L.",
        tone: "confirmed",
      },
      {
        start: 810,
        duration: 90,
        service: "Cut & finish",
        client: "Sara J.",
        tone: "confirmed",
      },
    ],
  },
  {
    day: "Fri",
    date: "24",
    appointments: [
      {
        start: 600,
        duration: 60,
        service: "Scalp ritual",
        client: "Mei C.",
        tone: "cancelled",
      },
      {
        start: 720,
        duration: 90,
        service: "Colour retouch",
        client: "Anya D.",
        tone: "confirmed",
      },
    ],
  },
];

const TONE_CLASSES = {
  pending: "border-status-pending-border bg-status-pending-soft text-status-pending",
  confirmed:
    "border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed",
  "in-progress":
    "border-status-progress-border bg-status-progress-soft text-status-progress",
  completed:
    "border-status-completed-border bg-status-completed-soft text-status-completed",
  cancelled:
    "border-status-cancelled-border bg-status-cancelled-soft text-status-cancelled",
} as const;

const START_HOUR = 9;
const END_HOUR = 17;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

function timeLabel(minutes: number) {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const suffix = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function CalendarPreview() {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, index) => START_HOUR + index);

  return (
    <div
      className="relative mx-auto w-full max-w-[590px] pb-10"
      role="img"
      aria-label="Illustration of the SlotWise weekly calendar showing staff appointments in different status colours"
    >
      <div
        className="absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-primary/15 via-transparent to-indigo-500/10 blur-2xl"
        aria-hidden
      />

      <div className="relative overflow-hidden rounded-[1.5rem] border border-white/80 bg-white shadow-[0_40px_90px_-38px_rgba(15,23,42,0.5)]">
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-primary/10">
              <span className="size-2 rounded-[3px] bg-primary" />
            </span>
            <span className="text-[11px] font-semibold text-foreground">
              Weekly schedule
            </span>
            <span className="rounded-full border border-border bg-muted/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
              Preview
            </span>
          </div>
          <div className="flex -space-x-2">
            {[
              ["AS", "bg-teal-100 text-teal-800"],
              ["MR", "bg-indigo-100 text-indigo-800"],
              ["JL", "bg-amber-100 text-amber-800"],
            ].map(([initials, classes]) => (
              <span
                key={initials}
                className={`flex size-6 items-center justify-center rounded-full border-2 border-white text-[8px] font-semibold ${classes}`}
              >
                {initials}
              </span>
            ))}
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                This week
              </p>
              <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] text-foreground">
                Oct 20 – 26
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/50 p-0.5">
              {["Day", "Week", "Month"].map((view) => (
                <span
                  key={view}
                  className={`rounded-md px-2 py-1 text-[9px] font-medium ${
                    view === "Week"
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground"
                  }`}
                >
                  {view}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-[34px_repeat(5,minmax(0,1fr))] text-center">
            <div />
            {DAYS.map((day) => (
              <div
                key={day.day}
                className={`pb-2 ${day.today ? "relative" : ""}`}
              >
                <p className="text-[8.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  {day.day}
                </p>
                <p
                  className={`mx-auto mt-1 flex size-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                    day.today
                      ? "bg-primary text-white"
                      : "text-foreground"
                  }`}
                >
                  {day.date}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-[34px_repeat(5,minmax(0,1fr))]">
            <div className="relative h-[250px]">
              {hours.map((hour) => (
                <span
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-[8px] tabular-nums text-muted-foreground"
                  style={{
                    top: `${((hour - START_HOUR) * 60 * 100) / TOTAL_MINUTES}%`,
                  }}
                >
                  {timeLabel(hour * 60)}
                </span>
              ))}
            </div>

            {DAYS.map((day) => (
              <div
                key={day.day}
                className={`relative h-[250px] border-l border-border/60 ${
                  day.today ? "bg-primary/[0.025]" : ""
                }`}
              >
                {hours.map((hour) => (
                  <span
                    key={hour}
                    className="pointer-events-none absolute inset-x-0 border-t border-border/50"
                    style={{
                      top: `${((hour - START_HOUR) * 60 * 100) / TOTAL_MINUTES}%`,
                    }}
                  />
                ))}

                {day.appointments.map((appointment) => {
                  const top =
                    ((appointment.start - START_HOUR * 60) * 100) / TOTAL_MINUTES;
                  const height = (appointment.duration * 100) / TOTAL_MINUTES;
                  return (
                    <div
                      key={`${day.day}-${appointment.start}`}
                      className={`absolute inset-x-1 overflow-hidden rounded-[5px] border border-l-2 px-1.5 py-1 ${TONE_CLASSES[appointment.tone]}`}
                      style={{ top: `${top}%`, height: `${height}%` }}
                    >
                      <p className="text-[7.5px] font-semibold tabular-nums opacity-80">
                        {timeLabel(appointment.start)}
                      </p>
                      <p className="truncate text-[8.5px] font-semibold leading-tight">
                        {appointment.service}
                      </p>
                      <p className="truncate text-[7.5px] leading-tight opacity-75">
                        {appointment.client}
                      </p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute -right-2 top-16 hidden items-center gap-1.5 rounded-full border border-border/80 bg-white/95 px-3 py-1.5 text-[10px] font-medium text-foreground shadow-lift backdrop-blur sm:flex">
        <ShieldCheck className="size-3.5 text-status-completed" />
        No conflicts
      </div>

      <div className="absolute -bottom-1 left-3 right-3 flex items-center gap-2.5 rounded-xl border border-border/80 bg-white/95 p-3 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.35)] backdrop-blur sm:-left-5 sm:right-auto sm:w-[248px]">
        <span className="flex size-8 items-center justify-center rounded-full bg-teal-100 text-[10px] font-semibold text-teal-800">
          AS
        </span>
        <div className="min-w-0">
          <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Next up · 10:30 AM
          </p>
          <p className="truncate text-[11px] font-semibold text-foreground">Amara Silva</p>
          <p className="truncate text-[9px] text-muted-foreground">
            Cut & finish · 60 min
          </p>
        </div>
        <span className="ml-auto rounded-md border border-status-confirmed-border bg-status-confirmed-soft px-1.5 py-0.5 text-[8px] font-semibold text-status-confirmed">
          Confirmed
        </span>
      </div>
    </div>
  );
}
