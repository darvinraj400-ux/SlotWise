import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Search, Scissors } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { PageHeader } from "@/components/app/page-header";
import { PaginationBar } from "@/components/app/pagination-bar";
import {
  CreateServiceButton,
  EditServiceButton,
} from "@/components/services/service-form-dialog";
import { ServiceStatusSwitch } from "@/components/services/service-status-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSession } from "@/lib/auth/context";
import { getServiceList, type ServiceStatusFilter } from "@/lib/data/services";
import { firstParam, parsePageParam } from "@/lib/data/helpers";
import { formatDuration } from "@/lib/appointments/booking";
import { formatMoney } from "@/lib/time";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, user, settings } = await requireSession();

  const search = firstParam(params.q)?.trim().slice(0, 120) ?? "";
  const statusParam = firstParam(params.status);
  const status: ServiceStatusFilter =
    statusParam === "active" || statusParam === "archived" ? statusParam : "all";
  const page = parsePageParam(params.page);

  const result = await getServiceList(supabase, user.id, {
    search,
    status,
    page,
  });

  const hasFilters = Boolean(search) || status !== "all";

  return (
    <div>
      <PageHeader
        eyebrow="Manage"
        title="Services"
        description="Your bookable menu — duration and price are captured on every appointment."
        actions={<CreateServiceButton />}
      />

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={search}
                placeholder="Search services"
                className="h-9 bg-background pl-9"
                aria-label="Search services"
              />
            </div>
            <div className="relative">
              <select
                name="status"
                defaultValue={status}
                aria-label="Filter by status"
                className="h-9 appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">All services</option>
                <option value="active">Active</option>
                <option value="archived">Inactive</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-9 px-4">
              Filter
            </Button>
            {hasFilters ? (
              <Button asChild variant="ghost" size="sm" className="h-9 text-muted-foreground">
                <Link href="/services">Clear</Link>
              </Button>
            ) : null}
          </form>
          <p className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {result.total} {result.total === 1 ? "service" : "services"}
          </p>
        </div>

        {result.services.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={Scissors}
              title={hasFilters ? "No services match those filters" : "Build your service menu"}
              description={
                hasFilters
                  ? "Try another search or clear the filters."
                  : "Add the services you offer, with the duration and price that should be booked."
              }
              action={
                hasFilters ? (
                  <Button asChild variant="outline">
                    <Link href="/services">Clear filters</Link>
                  </Button>
                ) : (
                  <CreateServiceButton />
                )
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Service</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="w-16 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <p className="text-[13.5px] font-medium">{service.name}</p>
                        {service.description ? (
                          <p className="mt-0.5 max-w-[420px] truncate text-[11.5px] text-muted-foreground">
                            {service.description}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-[12.5px] text-muted-foreground">
                        {formatDuration(service.duration_minutes)}
                      </TableCell>
                      <TableCell className="text-[12.5px] font-medium tabular-nums">
                        {formatMoney(service.price_amount, settings.currency_code)}
                      </TableCell>
                      <TableCell>
                        <ServiceStatusSwitch
                          serviceId={service.id}
                          isActive={service.is_active}
                          name={service.name}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <EditServiceButton service={service} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {result.services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-xl border border-border/80 bg-background/40 p-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold">{service.name}</p>
                      {service.description ? (
                        <p className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">
                          {service.description}
                        </p>
                      ) : null}
                    </div>
                    <EditServiceButton service={service} />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                    <div className="flex items-center gap-3 text-[12px]">
                      <span className="font-medium tabular-nums">
                        {formatMoney(service.price_amount, settings.currency_code)}
                      </span>
                      <span className="text-muted-foreground">
                        {formatDuration(service.duration_minutes)}
                      </span>
                    </div>
                    <ServiceStatusSwitch
                      serviceId={service.id}
                      isActive={service.is_active}
                      name={service.name}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 pb-4">
              <PaginationBar
                page={result.page}
                pageCount={result.pageCount}
                total={result.total}
                pageSize={result.pageSize}
                basePath="/services"
                params={{
                  q: search || undefined,
                  status: status !== "all" ? status : undefined,
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
