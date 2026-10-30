import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Search, Users } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { InitialsAvatar } from "@/components/app/avatar";
import { PageHeader } from "@/components/app/page-header";
import { PaginationBar } from "@/components/app/pagination-bar";
import { ActiveBadge } from "@/components/app/status-badge";
import { CreatePersonButton } from "@/components/people/person-form-dialog";
import { CustomerRowActions } from "@/components/customers/customer-row-actions";
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
import { getCustomerList, type CustomerStatusFilter } from "@/lib/data/customers";
import { firstParam, parsePageParam } from "@/lib/data/helpers";
import { formatZoned } from "@/lib/time";

export const metadata: Metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, user, settings } = await requireSession();

  const search = firstParam(params.q)?.trim().slice(0, 120) ?? "";
  const statusParam = firstParam(params.status);
  const status: CustomerStatusFilter =
    statusParam === "active" || statusParam === "archived" ? statusParam : "all";
  const page = parsePageParam(params.page);

  const result = await getCustomerList(supabase, user.id, {
    search,
    status,
    page,
  });

  const hasFilters = Boolean(search) || status !== "all";

  return (
    <div>
      <PageHeader
        eyebrow="Manage"
        title="Customers"
        description="Your customer book — searchable, private, and connected to every appointment."
        actions={<CreatePersonButton kind="customer" label="Add customer" />}
      />

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={search}
                placeholder="Search customers by name"
                className="h-9 bg-background pl-9"
                aria-label="Search customers by name"
              />
            </div>
            <div className="relative">
              <select
                name="status"
                defaultValue={status}
                aria-label="Filter by status"
                className="h-9 appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">All customers</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="h-9 px-4">
              Filter
            </Button>
            {hasFilters ? (
              <Button asChild variant="ghost" size="sm" className="h-9 text-muted-foreground">
                <Link href="/customers">Clear</Link>
              </Button>
            ) : null}
          </form>

          <p className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {result.total} {result.total === 1 ? "customer" : "customers"}
          </p>
        </div>

        {result.customers.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={Users}
              title={hasFilters ? "No customers match those filters" : "Your customer book is empty"}
              description={
                hasFilters
                  ? "Try a different name or status, or clear the filters to see everyone."
                  : "Add your first customer to start keeping a clean appointment history."
              }
              action={
                hasFilters ? (
                  <Button asChild variant="outline">
                    <Link href="/customers">Clear filters</Link>
                  </Button>
                ) : (
                  <CreatePersonButton kind="customer" label="Add your first customer" />
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
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-14 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.customers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <InitialsAvatar name={customer.full_name} />
                          <div className="min-w-0">
                            <Link
                              href={`/customers/${customer.id}`}
                              className="block truncate text-[13.5px] font-medium text-foreground hover:text-primary"
                            >
                              {customer.full_name}
                            </Link>
                            {customer.notes ? (
                              <p className="max-w-[240px] truncate text-[11px] text-muted-foreground">
                                {customer.notes}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-[12px] text-muted-foreground">
                          {customer.email ? <p>{customer.email}</p> : null}
                          {customer.phone ? <p>{customer.phone}</p> : null}
                          {!customer.email && !customer.phone ? <span>—</span> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ActiveBadge isActive={customer.is_active} />
                      </TableCell>
                      <TableCell className="text-[12px] text-muted-foreground">
                        {formatZoned(customer.created_at, settings.timezone, "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <CustomerRowActions customer={customer} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {result.customers.map((customer) => (
                <div
                  key={customer.id}
                  className="rounded-xl border border-border/80 bg-background/40 p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <InitialsAvatar name={customer.full_name} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/customers/${customer.id}`}
                        className="block truncate text-[14px] font-semibold hover:text-primary"
                      >
                        {customer.full_name}
                      </Link>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                        {customer.email || customer.phone || "No contact details"}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <ActiveBadge isActive={customer.is_active} />
                        <span className="text-[11px] text-muted-foreground">
                          Added {formatZoned(customer.created_at, settings.timezone, "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <CustomerRowActions customer={customer} />
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
                basePath="/customers"
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
