"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ConfirmActionDialog } from "@/components/app/confirm-action-dialog";
import { Button } from "@/components/ui/button";
import {
  getStatusActions,
  type AppointmentStatus,
  type StatusAction,
} from "@/lib/appointments/status";
import { transitionAppointmentStatusAction } from "@/lib/actions/appointments";

const TRANSITION_MESSAGES: Partial<Record<AppointmentStatus, string>> = {
  confirmed: "Appointment confirmed.",
  in_progress: "Appointment started.",
  completed: "Appointment completed.",
};

const CONFIRM_COPY: Partial<
  Record<AppointmentStatus, { title: string; description: string; confirmLabel: string; success: string }>
> = {
  cancelled: {
    title: "Cancel this appointment?",
    description:
      "The slot will be released, and this booking cannot be reopened. Create a replacement appointment if the customer rebooks.",
    confirmLabel: "Cancel appointment",
    success: "Appointment cancelled.",
  },
  no_show: {
    title: "Mark this appointment as a no-show?",
    description:
      "The customer did not attend. This closes the booking and cannot be undone.",
    confirmLabel: "Mark no-show",
    success: "Appointment marked as a no-show.",
  },
};

export function AppointmentStatusActions({
  appointmentId,
  status,
  startAt,
  endAt,
  nowIso,
  customerId,
}: {
  appointmentId: string;
  status: AppointmentStatus;
  startAt: string;
  endAt: string;
  nowIso: string;
  customerId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmAction, setConfirmAction] = useState<StatusAction | null>(null);
  const actions = getStatusActions(status, startAt, endAt, new Date(nowIso));

  function runAction(action: StatusAction) {
    startTransition(async () => {
      const result = await transitionAppointmentStatusAction(
        appointmentId,
        action.to,
      );
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        TRANSITION_MESSAGES[action.to] ?? "Appointment updated.",
      );
      router.refresh();
    });
  }

  function handleAction(action: StatusAction) {
    if (action.disabledReason) return;
    if (action.to === "cancelled" || action.to === "no_show") {
      setConfirmAction(action);
      return;
    }
    runAction(action);
  }

  if (actions.length === 0) {
    return (
      <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
        <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
          Appointment closed
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
          This booking is{" "}
          {status === "no_show" ? "marked as a no-show" : status.replace("_", " ")}. It
          cannot be reopened.
        </p>
        <Button asChild variant="outline" className="mt-4 w-full gap-1.5">
          <Link href={`/appointments/new?customerId=${customerId}`}>
            <CalendarPlus className="size-4" />
            Book another appointment
          </Link>
        </Button>
      </section>
    );
  }

  const confirmCopy = confirmAction
    ? CONFIRM_COPY[confirmAction.to]
    : undefined;

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
      <h2 className="text-[15px] font-semibold tracking-[-0.015em]">Next step</h2>
      <p className="mt-0.5 text-[12px] text-muted-foreground">
        Only valid transitions are offered.
      </p>

      <div className="mt-4 space-y-3">
        {actions.map((action) => {
          const disabled = Boolean(action.disabledReason) || pending;
          return (
            <div key={action.to}>
              <Button
                type="button"
                variant={
                  action.tone === "primary"
                    ? "default"
                    : action.tone === "destructive"
                      ? "ghost"
                      : "outline"
                }
                className={
                  action.tone === "destructive"
                    ? "w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    : "w-full justify-start gap-2"
                }
                disabled={disabled}
                onClick={() => handleAction(action)}
                title={action.disabledReason}
              >
                {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
                {action.label}
              </Button>
              {action.disabledReason ? (
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                  {action.disabledReason}
                </p>
              ) : action.to === "cancelled" || action.to === "no_show" ? null : (
                <p className="mt-1 text-[10.5px] leading-relaxed text-muted-foreground">
                  {action.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-1.5 border-t border-border/70 pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" />
        The database enforces the status workflow and timing rules, even if this page is
        open for a while.
      </div>

      <ConfirmActionDialog
        open={Boolean(confirmAction)}
        onOpenChange={(next) => {
          if (!next) setConfirmAction(null);
        }}
        title={confirmCopy?.title ?? "Confirm this change?"}
        description={confirmCopy?.description ?? ""}
        confirmLabel={confirmCopy?.confirmLabel ?? "Confirm"}
        successMessage={confirmCopy?.success ?? "Appointment updated."}
        destructive
        onConfirm={async () => {
          if (!confirmAction) return { ok: false, message: "Nothing selected." };
          return transitionAppointmentStatusAction(
            appointmentId,
            confirmAction.to,
          );
        }}
      />
    </section>
  );
}
