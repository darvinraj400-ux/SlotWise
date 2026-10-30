import {
  APPOINTMENT_STATUSES,
  STATUS_META,
  type AppointmentStatus,
} from "@/lib/appointments/status";
import type { Appointment } from "@/lib/types";

export type ReportableAppointment = Pick<
  Appointment,
  "status" | "price_amount_snapshot" | "service_name_snapshot" | "staff_id" | "start_at"
> & {
  staff?: { full_name: string } | null;
};

export type ReportStatusCount = {
  status: AppointmentStatus;
  label: string;
  count: number;
  color: string;
};

export type ReportServiceRow = {
  name: string;
  bookings: number;
  completed: number;
  cancelled: number;
  revenue: number;
};

export type ReportStaffRow = {
  staffId: string;
  name: string;
  bookings: number;
  completed: number;
  cancelled: number;
  noShow: number;
  revenue: number;
};

export function sumRevenue(appointments: ReportableAppointment[]): number {
  const total = appointments
    .filter((appointment) => appointment.status === "completed")
    .reduce(
      (sum, appointment) => sum + Number(appointment.price_amount_snapshot),
      0,
    );
  return Math.round(total * 100) / 100;
}

export function countByStatus(
  appointments: ReportableAppointment[],
): Record<AppointmentStatus, number> {
  const counts = Object.fromEntries(
    APPOINTMENT_STATUSES.map((status) => [status, 0]),
  ) as Record<AppointmentStatus, number>;

  for (const appointment of appointments) {
    if (appointment.status in counts) {
      counts[appointment.status as AppointmentStatus] += 1;
    }
  }

  return counts;
}

export function statusChartData(
  appointments: ReportableAppointment[],
): ReportStatusCount[] {
  const counts = countByStatus(appointments);
  return APPOINTMENT_STATUSES.map((status) => ({
    status,
    label: STATUS_META[status].label,
    count: counts[status],
    color: STATUS_META[status].chartColor,
  }));
}

export function serviceBreakdown(
  appointments: ReportableAppointment[],
): ReportServiceRow[] {
  const map = new Map<string, ReportServiceRow>();

  for (const appointment of appointments) {
    const name = appointment.service_name_snapshot;
    const row = map.get(name) ?? {
      name,
      bookings: 0,
      completed: 0,
      cancelled: 0,
      revenue: 0,
    };
    row.bookings += 1;
    if (appointment.status === "completed") {
      row.completed += 1;
      row.revenue += Number(appointment.price_amount_snapshot);
    }
    if (appointment.status === "cancelled") row.cancelled += 1;
    map.set(name, row);
  }

  return [...map.values()]
    .map((row) => ({ ...row, revenue: Math.round(row.revenue * 100) / 100 }))
    .sort((a, b) => b.bookings - a.bookings || a.name.localeCompare(b.name));
}

export function staffBreakdown(
  appointments: ReportableAppointment[],
): ReportStaffRow[] {
  const map = new Map<string, ReportStaffRow>();

  for (const appointment of appointments) {
    const staffId = appointment.staff_id;
    const row = map.get(staffId) ?? {
      staffId,
      name: appointment.staff?.full_name ?? "Unassigned",
      bookings: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      revenue: 0,
    };
    row.bookings += 1;
    if (appointment.status === "completed") {
      row.completed += 1;
      row.revenue += Number(appointment.price_amount_snapshot);
    }
    if (appointment.status === "cancelled") row.cancelled += 1;
    if (appointment.status === "no_show") row.noShow += 1;
    map.set(staffId, row);
  }

  return [...map.values()]
    .map((row) => ({ ...row, revenue: Math.round(row.revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name));
}

export function appointmentSummary(appointments: ReportableAppointment[]) {
  const byStatus = countByStatus(appointments);
  return {
    total: appointments.length,
    byStatus,
    completed: byStatus.completed,
    cancelled: byStatus.cancelled,
    noShow: byStatus.no_show,
    revenue: sumRevenue(appointments),
  };
}

export function percentage(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
