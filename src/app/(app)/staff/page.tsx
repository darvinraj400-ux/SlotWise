import type { Metadata } from "next";
import Link from "next/link";
import { ChevronDown, Search, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/app/empty-state";
import { InitialsAvatar } from "@/components/app/avatar";
import { PageHeader } from "@/components/app/page-header";
import { PaginationBar } from "@/components/app/pagination-bar";
import { ActiveBadge } from "@/components/app/status-badge";
import { CreatePersonButton } from "@/components/people/person-form-dialog";
import { StaffRowActions } from "@/components/staff/staff-row-actions";
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
import { getStaffList, type StaffStatusFilter } from "@/lib/data/staff";
import { firstParam, parsePageParam } from "@/lib/data/helpers";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireSession();

  const search = firstParam(params.q)?.trim().slice(0, 120) ?? "";
  const statusParam = firstParam(params.status);
  const status: StaffStatusFilter =
    statusParam === "active" || statusParam === "archived" ? statusParam : "all";
  const page = parsePageParam(params.page);

  const result = await getStaffList(supabase, user.id, { search, status, page });
  const hasFilters = Boolean(search) || status !== "all";

  return (
    <div>
      <PageHeader
        eyebrow="Manage"
        title="Staff"
        description="The people on your schedule — with working hours, time off, and upcoming bookings."
        actions={<CreatePersonButton kind="staff" label="Add staff" />}
      />

      <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
        <div className="flex flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <form method="get" className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={search}
                placeholder="Search staff by name"
                className="h-9 bg-background pl-9"
                aria-label="Search staff by name"
              />
            </div>
            <div className="relative">
              <select
                name="status"
                defaultValue={status}
                aria-label="Filter by status"
                className="h-9 appearance-none rounded-lg border border-input bg-background pl-3 pr-8 text-[13px] outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="all">All staff</option>
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
                <Link href="/staff">Clear</Link>
              </Button>
            ) : null}
          </form>
          <p className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
            {result.total} {result.total === 1 ? "staff member" : "staff members"}
          </p>
        </div>

        {result.staff.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState
              icon={UsersRound}
              title={hasFilters ? "No staff match those filters" : "Add your first staff member"}
              description={
                hasFilters
                  ? "Try another search or clear the filters."
                  : "Staff are the scheduling resources for your appointments. Add someone and set their working week."
              }
              action={
                hasFilters ? (
                  <Button asChild variant="outline">
                    <Link href="/staff">Clear filters</Link>
                  </Button>
                ) : (
                  <CreatePersonButton kind="staff" label="Add staff member" />
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
                    <TableHead>Staff member</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-14 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <InitialsAvatar name={member.full_name} />
                          <div className="min-w-0">
                            <Link
                              href={`/staff/${member.id}`}
                              className="block truncate text-[13.5px] font-medium hover:text-primary"
                            >
                              {member.full_name}
                            </Link>
                            {member.notes ? (
                              <p className="max-w-[260px] truncate text-[11px] text-muted-foreground">
                                {member.notes}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-[12px] text-muted-foreground">
                          {member.email ? <p>{member.email}</p> : null}
                          {member.phone ? <p>{member.phone}</p> : null}
                          {!member.email && !member.phone ? <span>—</span> : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ActiveBadge isActive={member.is_active} activeLabel="Active" inactiveLabel="Inactive" />
                      </TableCell>
                      <TableCell className="text-right">
                        <StaffRowActions staff={member} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {result.staff.map((member) => (
                <div
                  key={member.id}
                  className="rounded-xl border border-border/80 bg-background/40 p-3.5"
                >
                  <div className="flex items-start gap-3">
                    <InitialsAvatar name={member.full_name} />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/staff/${member.id}`}
                        className="block truncate text-[14px] font-semibold hover:text-primary"
                      >
                        {member.full_name}
                      </Link>
                      <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                        {member.email || member.phone || "No contact details"}
                      </p>
                      <div className="mt-2">
                        <ActiveBadge
                          isActive={member.is_active}
                          activeLabel="Active"
                          inactiveLabel="Inactive"
                        />
                      </div>
                    </div>
                    <StaffRowActions staff={member} />
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
                basePath="/staff"
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
