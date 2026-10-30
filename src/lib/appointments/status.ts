export const APPOINTMENT_STATUSES = [
  "pending",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const STATUS_META: Record<
  AppointmentStatus,
  {
    label: string;
    description: string;
    badgeClass: string;
    blockClass: string;
    dotClass: string;
    chartColor: string;
  }
> = {
  pending: {
    label: "Pending",
    description: "Awaiting confirmation",
    badgeClass:
      "border-status-pending-border bg-status-pending-soft text-status-pending",
    blockClass:
      "border-status-pending-border bg-status-pending-soft text-status-pending",
    dotClass: "bg-status-pending",
    chartColor: "#d97706",
  },
  confirmed: {
    label: "Confirmed",
    description: "Scheduled and confirmed",
    badgeClass:
      "border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed",
    blockClass:
      "border-status-confirmed-border bg-status-confirmed-soft text-status-confirmed",
    dotClass: "bg-status-confirmed",
    chartColor: "#0f766e",
  },
  in_progress: {
    label: "In progress",
    description: "Currently underway",
    badgeClass:
      "border-status-progress-border bg-status-progress-soft text-status-progress",
    blockClass:
      "border-status-progress-border bg-status-progress-soft text-status-progress",
    dotClass: "bg-status-progress",
    chartColor: "#4f46e5",
  },
  completed: {
    label: "Completed",
    description: "Finished successfully",
    badgeClass:
      "border-status-completed-border bg-status-completed-soft text-status-completed",
    blockClass:
      "border-status-completed-border bg-status-completed-soft text-status-completed",
    dotClass: "bg-status-completed",
    chartColor: "#059669",
  },
  cancelled: {
    label: "Cancelled",
    description: "Called off",
    badgeClass:
      "border-status-cancelled-border bg-status-cancelled-soft text-status-cancelled",
    blockClass:
      "border-status-cancelled-border bg-status-cancelled-soft text-status-cancelled",
    dotClass: "bg-status-cancelled",
    chartColor: "#e11d48",
  },
  no_show: {
    label: "No-show",
    description: "Customer did not attend",
    badgeClass:
      "border-status-noshow-border bg-status-noshow-soft text-status-noshow",
    blockClass:
      "border-status-noshow-border bg-status-noshow-soft text-status-noshow",
    dotClass: "bg-status-noshow",
    chartColor: "#64748b",
  },
};

export const TERMINAL_STATUSES: AppointmentStatus[] = [
  "completed",
  "cancelled",
  "no_show",
];

export const ACTIVE_STATUSES: AppointmentStatus[] = [
  "pending",
  "confirmed",
  "in_progress",
];

export const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled", "no_show"],
  in_progress: ["completed"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function isAppointmentStatus(value: string): value is AppointmentStatus {
  return (APPOINTMENT_STATUSES as readonly string[]).includes(value);
}

export function isTerminalStatus(status: AppointmentStatus) {
  return TERMINAL_STATUSES.includes(status);
}

export function canTransition(from: AppointmentStatus, to: AppointmentStatus) {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export type StatusActionTone = "primary" | "outline" | "destructive";

export type StatusAction = {
  to: AppointmentStatus;
  label: string;
  description: string;
  tone: StatusActionTone;
  disabledReason?: string;
};

const START_EARLY_WINDOW_MINUTES = 15;

export function getStatusActions(
  status: AppointmentStatus,
  startAt: string | Date,
  endAt: string | Date,
  now = new Date(),
): StatusAction[] {
  const start = startAt instanceof Date ? startAt : new Date(startAt);
  const end = endAt instanceof Date ? endAt : new Date(endAt);
  const nowMs = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();

  const startWindowOpens = startMs - START_EARLY_WINDOW_MINUTES * 60_000;

  switch (status) {
    case "pending":
      return [
        {
          to: "confirmed",
          label: "Confirm appointment",
          description: "Let the customer know this booking is locked in.",
          tone: "primary",
        },
        {
          to: "cancelled",
          label: "Cancel appointment",
          description: "Release the slot and close this booking.",
          tone: "outline",
        },
      ];
    case "confirmed": {
      const startDisabled =
        nowMs < startWindowOpens
          ? `You can start this appointment from ${START_EARLY_WINDOW_MINUTES} minutes before its scheduled time.`
          : nowMs > endMs
            ? "This appointment has already ended. Mark it as a no-show or cancelled instead."
            : undefined;

      const noShowDisabled =
        nowMs < startMs
          ? "A no-show can only be marked after the scheduled start time."
          : undefined;

      return [
        {
          to: "in_progress",
          label: "Start appointment",
          description: "Move the booking into the chair.",
          tone: "primary",
          disabledReason: startDisabled,
        },
        {
          to: "no_show",
          label: "Mark no-show",
          description: "The customer did not attend.",
          tone: "outline",
          disabledReason: noShowDisabled,
        },
        {
          to: "cancelled",
          label: "Cancel appointment",
          description: "Release the slot and close this booking.",
          tone: "outline",
        },
      ];
    }
    case "in_progress":
      return [
        {
          to: "completed",
          label: "Complete appointment",
          description: "Record the visit as finished and count the revenue.",
          tone: "primary",
        },
      ];
    default:
      return [];
  }
}

export function canPerformAction(
  status: AppointmentStatus,
  to: AppointmentStatus,
  startAt: string | Date,
  endAt: string | Date,
  now = new Date(),
) {
  const action = getStatusActions(status, startAt, endAt, now).find(
    (item) => item.to === to,
  );
  return Boolean(action && !action.disabledReason);
}
