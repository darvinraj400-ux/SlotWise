"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, CalendarPlus, MoreHorizontal, Pencil, RotateCcw } from "lucide-react";
import { ConfirmActionDialog } from "@/components/app/confirm-action-dialog";
import { PersonFormDialog } from "@/components/people/person-form-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setCustomerActiveAction } from "@/lib/actions/customers";
import type { Customer } from "@/lib/types";

export function CustomerDetailActions({ customer }: { customer: Customer }) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  return (
    <>
      {customer.is_active ? (
        <Button asChild className="gap-1.5">
          <Link href={`/appointments/new?customerId=${customer.id}`}>
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
          <Button variant="outline" size="icon" aria-label="More customer actions">
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => setArchiveOpen(true)}
            className={`cursor-pointer gap-2 ${
              customer.is_active ? "text-destructive focus:text-destructive" : ""
            }`}
          >
            {customer.is_active ? (
              <Archive className="size-4" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            {customer.is_active ? "Archive customer" : "Restore customer"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PersonFormDialog
        kind="customer"
        entity={customer}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmActionDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={customer.is_active ? "Archive this customer?" : "Restore this customer?"}
        description={
          customer.is_active
            ? "Their appointment history and existing bookings stay intact. They simply cannot be selected for new bookings."
            : "They will become selectable for new appointments again."
        }
        confirmLabel={customer.is_active ? "Archive customer" : "Restore customer"}
        successMessage={customer.is_active ? "Customer archived." : "Customer restored."}
        destructive={customer.is_active}
        onConfirm={() => setCustomerActiveAction(customer.id, !customer.is_active)}
      />
    </>
  );
}
