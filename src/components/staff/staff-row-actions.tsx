"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Archive,
  CalendarClock,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setStaffActiveAction } from "@/lib/actions/staff";
import type { Staff } from "@/lib/types";

export function StaffRowActions({ staff }: { staff: Staff }) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${staff.full_name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`/staff/${staff.id}`} className="cursor-pointer gap-2">
              <CalendarClock className="size-4" />
              View schedule
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setEditOpen(true)}
            className="cursor-pointer gap-2"
          >
            <Pencil className="size-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
            {staff.is_active ? "Deactivate" : "Reactivate"}
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
            ? "They will disappear from booking options, while existing appointments and their schedule remain intact."
            : "They will be available for new bookings again, subject to their working hours."
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
