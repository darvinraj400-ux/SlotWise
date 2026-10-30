import { NextResponse, type NextRequest } from "next/server";
import { buildCsv, type CsvColumn } from "@/lib/csv";
import { getAuthContext } from "@/lib/auth/context";
import {
  getReportAppointments,
  resolveReportRange,
} from "@/lib/data/reports";
import type {
  AppointmentRangeResult,
  AppointmentWithDetails,
} from "@/lib/data/appointments";
import { isAppointmentStatus, STATUS_META } from "@/lib/appointments/status";
import { formatDateKey, formatTime } from "@/lib/time";
import { logActionError } from "@/lib/errors";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let context;
  try {
    context = await getAuthContext();
  } catch (error) {
    logActionError("reports.export.config", error);
    return new NextResponse("Reports are not configured correctly.", { status: 500 });
  }

  if (!context.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!context.settings) {
    return new NextResponse("Business settings are unavailable.", { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const timeZone = context.settings.timezone;
  const range = resolveReportRange(
    searchParams.get("from") ?? undefined,
    searchParams.get("to") ?? undefined,
    timeZone,
  );

  let reportResult: AppointmentRangeResult;
  try {
    reportResult = await getReportAppointments(
      context.supabase,
      context.user.id,
      range,
    );
  } catch (error) {
    logActionError("reports.export.data", error);
    return new NextResponse("The export could not be generated.", { status: 500 });
  }

  if (reportResult.exceeded) {
    return new NextResponse(
      `This date range contains more than ${
        reportResult.limit?.toLocaleString() ?? "the configured maximum"
      } appointments. Narrow the range and try again; no partial export was generated.`,
      {
        status: 413,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }

  const appointments = reportResult.appointments;

  const columns: CsvColumn<AppointmentWithDetails>[] = [
    {
      header: "Date",
      value: (row) => formatDateKey(row.start_at, timeZone),
    },
    {
      header: "Start",
      value: (row) => formatTime(row.start_at, timeZone),
    },
    {
      header: "End",
      value: (row) => formatTime(row.end_at, timeZone),
    },
    {
      header: "Customer",
      value: (row) => row.customers?.full_name ?? "",
    },
    {
      header: "Customer email",
      value: (row) => row.customers?.email ?? "",
    },
    {
      header: "Customer phone",
      value: (row) => row.customers?.phone ?? "",
    },
    {
      header: "Service",
      value: (row) => row.service_name_snapshot,
    },
    {
      header: "Staff",
      value: (row) => row.staff?.full_name ?? "",
    },
    {
      header: "Status",
      value: (row) =>
        isAppointmentStatus(row.status)
          ? STATUS_META[row.status].label
          : row.status,
    },
    {
      header: "Duration (minutes)",
      value: (row) => row.duration_minutes_snapshot,
    },
    {
      header: "Price",
      value: (row) => Number(row.price_amount_snapshot).toFixed(2),
    },
    {
      header: "Currency",
      value: () => context.settings!.currency_code,
    },
    {
      header: "Notes",
      value: (row) => row.notes ?? "",
    },
    {
      header: "Timezone",
      value: () => timeZone,
    },
  ];

  const csv = buildCsv(appointments, columns);
  const filename = `slotwise-appointments-${range.fromKey}-to-${range.toKey}.csv`;

  return new NextResponse(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
