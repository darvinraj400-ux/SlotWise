"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { AlertCircle, Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/app/field";
import { FormDialog } from "@/components/app/form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createServiceAction,
  updateServiceAction,
} from "@/lib/actions/services";
import {
  serviceSchema,
  type ServiceInput,
} from "@/lib/validation/schemas";

type ServiceEntity = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_amount: number;
};

type ServiceFormValues = {
  name: string;
  description?: string;
  durationMinutes: number;
  priceAmount: number;
};

const DEFAULTS: ServiceFormValues = {
  name: "",
  description: "",
  durationMinutes: 60,
  priceAmount: 0,
};

export function ServiceFormDialog({
  service,
  open,
  onOpenChange,
}: {
  service?: ServiceEntity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={service ? "Edit service" : "Add a service"}
      description="Services define the duration and price used for new bookings. Existing appointments keep their snapshot."
    >
      <ServiceFormBody service={service} onClose={() => onOpenChange(false)} />
    </FormDialog>
  );
}

function ServiceFormBody({
  service,
  onClose,
}: {
  service?: ServiceEntity;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ServiceFormValues>({
    defaultValues: service
      ? {
          name: service.name,
          description: service.description ?? "",
          durationMinutes: service.duration_minutes,
          priceAmount: Number(service.price_amount),
        }
      : DEFAULTS,
  });

  function onSubmit(values: ServiceFormValues) {
    setGeneralError(null);
    const parsed = serviceSchema.safeParse(values);
    if (!parsed.success) {
      for (const [field, messages] of Object.entries(
        parsed.error.flatten().fieldErrors,
      )) {
        const message = (messages as string[] | undefined)?.[0];
        if (message && field in values) {
          setError(field as keyof ServiceFormValues, { message });
        }
      }
      return;
    }

    startTransition(async () => {
      const result = service
        ? await updateServiceAction(service.id, parsed.data as ServiceInput)
        : await createServiceAction(parsed.data as ServiceInput);

      if (!result.ok) {
        setGeneralError(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages[0] && field in values) {
              setError(field as keyof ServiceFormValues, { message: messages[0] });
            }
          }
        }
        toast.error(result.message);
        return;
      }

      toast.success(service ? "Service updated." : "Service added.");
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

      <Field label="Service name" htmlFor="service-name" error={errors.name?.message} required>
        <Input
          id="service-name"
          placeholder="e.g. Cut & finish"
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Duration (minutes)"
          htmlFor="service-duration"
          error={errors.durationMinutes?.message}
          hint="Between 5 minutes and 12 hours."
          required
        >
          <Input
            id="service-duration"
            type="number"
            min={5}
            max={720}
            step={5}
            aria-invalid={Boolean(errors.durationMinutes)}
            {...register("durationMinutes", { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Price"
          htmlFor="service-price"
          error={errors.priceAmount?.message}
          hint="Stored to two decimal places."
          required
        >
          <Input
            id="service-price"
            type="number"
            min={0}
            max={1000000}
            step="0.01"
            aria-invalid={Boolean(errors.priceAmount)}
            {...register("priceAmount", { valueAsNumber: true })}
          />
        </Field>
      </div>

      <Field
        label="Description"
        htmlFor="service-description"
        error={errors.description?.message}
      >
        <Textarea
          id="service-description"
          placeholder="What the service includes or who it is for."
          rows={3}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </Field>

      <div className="flex justify-end gap-2 border-t border-border/80 pt-4">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending} className="gap-1.5">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {pending ? "Saving…" : service ? "Save changes" : "Create service"}
        </Button>
      </div>
    </form>
  );
}

export function CreateServiceButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-1.5">
        <Plus className="size-4" />
        New service
      </Button>
      <ServiceFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

export function EditServiceButton({ service }: { service: ServiceEntity }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        aria-label={`Edit ${service.name}`}
      >
        <Pencil className="size-4" />
      </Button>
      <ServiceFormDialog service={service} open={open} onOpenChange={setOpen} />
    </>
  );
}
