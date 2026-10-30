"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  CalendarPlus,
  MoreHorizontal,
  Pencil,
  RotateCcw,
} from "lucide-react";
import { ConfirmActionDialog } from "@/components/app/confirm-action-dialog";
import { PersonFormDialog } from "@/components/people/person-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setStaffActiveAction } from "@/lib/actions/staff";
import type { Staff } from "@/lib/types";

export function StaffDetailActions({ staff }: { staff: Staff }) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  return (
    <>
      {staff.is_active ? (
        <Button asChild className="gap-1.5">
          <Link href={`/appointments/new?staffId=${staff.id}`}>
            <CalendarPlus className="size-4" />
            Book appointment
          </Link>
        </Button>
      ) : null}
      <Button variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5">
        <Pencil className="size-4" />
        Edit
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More staff actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => setArchiveOpen(true)}
            className={`cursor-pointer gap-2 ${
              staff.is_active ? "text-destructive focus:text-destructive" : ""
            }`}
          >
            {staff.is_active ? (
              <Archive className="size-4" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            {staff.is_active ? "Deactivate staff member" : "Reactivate staff member"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PersonFormDialog
        kind="staff"
        entity={staff}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmActionDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={
          staff.is_active ? "Deactivate this staff member?" : "Reactivate this staff member?"
        }
        description={
          staff.is_active
            ? "They will no longer be offered for new bookings. Their schedule, time off, and existing appointments stay intact."
            : "They will become available for new bookings again."
        }
        confirmLabel={staff.is_active ? "Deactivate staff member" : "Reactivate staff member"}
        successMessage={
          staff.is_active ? "Staff member deactivated." : "Staff member reactivated."
        }
        destructive={staff.is_active}
        onConfirm={() => setStaffActiveAction(staff.id, !staff.is_active)}
      />
    </>
  );
}
