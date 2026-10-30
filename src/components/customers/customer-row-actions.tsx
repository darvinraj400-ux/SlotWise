"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, MoreHorizontal, Pencil, RotateCcw, UserRound } from "lucide-react";
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
import { setCustomerActiveAction } from "@/lib/actions/customers";
import type { Customer } from "@/lib/types";

export function CustomerRowActions({ customer }: { customer: Customer }) {
  const [editOpen, setEditOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${customer.full_name}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/customers/${customer.id}`} className="cursor-pointer gap-2">
              <UserRound className="size-4" />
              View details
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
              customer.is_active ? "text-destructive focus:text-destructive" : ""
            }`}
          >
            {customer.is_active ? (
              <Archive className="size-4" />
            ) : (
              <RotateCcw className="size-4" />
            )}
            {customer.is_active ? "Archive" : "Restore"}
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
            ? "Their appointment history is kept, but they cannot be selected for new bookings. You can restore them at any time."
            : "This customer will become available for new bookings again."
        }
        confirmLabel={customer.is_active ? "Archive customer" : "Restore customer"}
        successMessage={
          customer.is_active ? "Customer archived." : "Customer restored."
        }
        destructive={customer.is_active}
        onConfirm={() => setCustomerActiveAction(customer.id, !customer.is_active)}
      />
    </>
  );
}
