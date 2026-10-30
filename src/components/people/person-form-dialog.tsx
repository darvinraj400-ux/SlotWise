"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/app/field";
import { FormDialog } from "@/components/app/form-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/lib/actions/customers";
import {
  createStaffAction,
  updateStaffAction,
} from "@/lib/actions/staff";
import { customerSchema, type CustomerInput } from "@/lib/validation/schemas";

type PersonEntity = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
};

type PersonKind = "customer" | "staff";

const COPY = {
  customer: {
    createTitle: "Add a customer",
    editTitle: "Edit customer",
    description: "Contact details stay private to your business.",
    nameLabel: "Full name",
    namePlaceholder: "e.g. Amara Silva",
    createLabel: "Create customer",
    updated: "Customer updated.",
    created: "Customer added.",
  },
  staff: {
    createTitle: "Add a staff member",
    editTitle: "Edit staff member",
    description: "Staff are scheduling resources in SlotWise — no separate login.",
    nameLabel: "Full name",
    namePlaceholder: "e.g. Maya Chen",
    createLabel: "Add staff member",
    updated: "Staff member updated.",
    created: "Staff member added.",
  },
} as const;

export function PersonFormDialog({
  kind,
  entity,
  open,
  onOpenChange,
  onCreated,
}: {
  kind: PersonKind;
  entity?: PersonEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const copy = COPY[kind];

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={entity ? copy.editTitle : copy.createTitle}
      description={copy.description}
    >
      <PersonFormBody
        kind={kind}
        entity={entity}
        onClose={() => onOpenChange(false)}
        onCreated={onCreated}
      />
    </FormDialog>
  );
}

function PersonFormBody({
  kind,
  entity,
  onClose,
  onCreated,
}: {
  kind: PersonKind;
  entity?: PersonEntity;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const copy = COPY[kind];
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CustomerInput>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: entity?.full_name ?? "",
      email: entity?.email ?? "",
      phone: entity?.phone ?? "",
      notes: entity?.notes ?? "",
    },
  });

  function onSubmit(values: CustomerInput) {
    setGeneralError(null);
    startTransition(async () => {
      const result = entity
        ? kind === "customer"
          ? await updateCustomerAction(entity.id, values)
          : await updateStaffAction(entity.id, values)
        : kind === "customer"
          ? await createCustomerAction(values)
          : await createStaffAction(values);

      if (!result.ok) {
        setGeneralError(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages[0] && field in values) {
              setError(field as keyof CustomerInput, { message: messages[0] });
            }
          }
        }
        toast.error(result.message);
        return;
      }

      toast.success(entity ? copy.updated : copy.created);
      if (!entity && result.data && "id" in result.data) {
        onCreated?.(result.data.id);
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {generalError ? (
        <div
          role="alert"
          className="flex gap-2.5 rounded-xl border border-status-cancelled-border bg-status-cancelled-soft p-3 text-[12.5px] text-status-cancelled"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{generalError}</p>
        </div>
      ) : null}

      <Field
        label={copy.nameLabel}
        htmlFor={`${kind}-name`}
        error={errors.fullName?.message}
        required
      >
        <Input
          id={`${kind}-name`}
          placeholder={copy.namePlaceholder}
          autoComplete="name"
          aria-invalid={Boolean(errors.fullName)}
          {...register("fullName")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" htmlFor={`${kind}-email`} error={errors.email?.message}>
          <Input
            id={`${kind}-email`}
            type="email"
            placeholder="Optional"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
        </Field>
        <Field label="Phone" htmlFor={`${kind}-phone`} error={errors.phone?.message}>
          <Input
            id={`${kind}-phone`}
            type="tel"
            placeholder="Optional"
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
            {...register("phone")}
          />
        </Field>
      </div>

      <Field label="Notes" htmlFor={`${kind}-notes`} error={errors.notes?.message}>
        <Textarea
          id={`${kind}-notes`}
          placeholder="Preferences, context, or anything worth remembering."
          rows={3}
          aria-invalid={Boolean(errors.notes)}
          {...register("notes")}
        />
      </Field>

      <div className="flex justify-end gap-2 border-t border-border/80 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="gap-1.5">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {pending ? "Saving…" : entity ? "Save changes" : copy.createLabel}
        </Button>
      </div>
    </form>
  );
}

export function CreatePersonButton({
  kind,
  label,
}: {
  kind: PersonKind;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-4" />
        {label}
      </Button>
      <PersonFormDialog kind={kind} open={open} onOpenChange={setOpen} />
    </>
  );
}
