"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReportServiceRow, ReportStatusCount } from "@/lib/reports";

const TOOLTIP_STYLE = {
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  fontSize: "11px",
  boxShadow: "0 8px 24px -12px rgba(15, 23, 42, 0.35)",
};

export function StatusMixChart({
  data,
  total,
}: {
  data: ReportStatusCount[];
  total: number;
}) {
  const visible = data.filter((item) => item.count > 0);

  if (visible.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-[12px] text-muted-foreground">
        No appointments in this period yet.
      </div>
    );
  }

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[190px_minmax(0,1fr)]">
      <div className="relative mx-auto h-[190px] w-full max-w-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart accessibilityLayer>
            <Pie
              data={visible}
              dataKey="count"
              nameKey="label"
              innerRadius={56}
              outerRadius={82}
              paddingAngle={2}
              strokeWidth={0}
            >
              {visible.map((item) => (
                <Cell key={item.status} fill={item.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value) => [`${value} appointments`, ""]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[24px] font-semibold leading-none tabular-nums">
            {total}
          </span>
          <span className="mt-1 text-[10px] text-muted-foreground">appointments</span>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-1">
        {data.map((item) => (
          <li key={item.status} className="flex items-center gap-2 text-[11.5px]">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">
              {item.label}
            </span>
            <span className="font-semibold tabular-nums">{item.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ServiceDemandChart({ data }: { data: ReportServiceRow[] }) {
  const chartData = [...data]
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5)
    .map((row) => ({
      name: row.name.length > 16 ? `${row.name.slice(0, 15)}…` : row.name,
      bookings: row.bookings,
      completed: row.completed,
      revenue: row.revenue,
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-[230px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-[12px] text-muted-foreground">
        Service demand will appear once you have bookings.
      </div>
    );
  }

  return (
    <div className="h-[230px] w-full" role="img" aria-label="Bookings and completed visits by service">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 8, right: 4, left: -24, bottom: 0 }}
          barGap={3}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.7} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={{ fontSize: 9.5, fill: "var(--muted-foreground)" }}
            tickMargin={8}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={38}
            tick={{ fontSize: 9.5, fill: "var(--muted-foreground)" }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "var(--muted)", opacity: 0.35 }}
          />
          <Bar
            dataKey="bookings"
            name="Bookings"
            fill="#0f766e"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="completed"
            name="Completed"
            fill="#6366f1"
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RevenueByStaffChart({
  data,
  currencyCode,
}: {
  data: { name: string; revenue: number }[];
  currencyCode: string;
}) {
  const chartData = data.filter((row) => row.revenue > 0).slice(0, 6);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[240px] items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-[12px] text-muted-foreground">
        Revenue by staff will appear after completed appointments.
      </div>
    );
  }

  return (
    <div className="h-[240px] w-full" role="img" aria-label="Revenue by staff member">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
          accessibilityLayer
        >
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeOpacity={0.7} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 9.5, fill: "var(--muted-foreground)" }}
            tickFormatter={(value: number) =>
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currencyCode,
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(value)
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            width={96}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: "var(--foreground)" }}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            cursor={{ fill: "var(--muted)", opacity: 0.35 }}
            formatter={(value) => [
              new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currencyCode,
                maximumFractionDigits: 2,
              }).format(Number(value)),
              "Revenue",
            ]}
          />
          <Bar dataKey="revenue" fill="#0f766e" radius={[0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
