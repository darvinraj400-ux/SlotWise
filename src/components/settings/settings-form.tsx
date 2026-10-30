"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Globe2 } from "lucide-react";
import { toast } from "sonner";
import { Field } from "@/components/app/field";
import { SubmitButton } from "@/components/app/submit-button";
import { TimezoneSelect } from "@/components/settings/timezone-select";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateSettingsAction } from "@/lib/actions/settings";
import { INITIAL_FORM_STATE } from "@/lib/actions/types";
import { CURRENCIES } from "@/lib/time";

export function SettingsForm({
  businessName,
  timezone,
  currencyCode,
  timezones,
}: {
  businessName: string;
  timezone: string;
  currencyCode: string;
  timezones: string[];
}) {
  const [state, formAction] = useActionState(updateSettingsAction, INITIAL_FORM_STATE);
  const [selectedTimezone, setSelectedTimezone] = useState(timezone);
  const [currency, setCurrency] = useState(currencyCode);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") {
      toast.success(state.message ?? "Settings saved.");
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="min-w-0 space-y-6">
      <input type="hidden" name="timezone" value={selectedTimezone} />
      <input type="hidden" name="currencyCode" value={currency} />

      {state.status === "error" && state.message ? (
        <div
          role="alert"
          className="flex gap-2.5 rounded-xl border border-status-cancelled-border bg-status-cancelled-soft p-3 text-[13px] text-status-cancelled"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{state.message}</p>
        </div>
      ) : null}

      {state.status === "success" ? (
        <div className="flex gap-2.5 rounded-xl border border-status-completed-border bg-status-completed-soft p-3 text-[13px] text-status-completed">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
          <p>{state.message}</p>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border/80 bg-card shadow-card">
        <div className="border-b border-border/80 px-5 py-4 sm:px-6">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
            Business profile
          </h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            These details shape your workspace and how dates and prices are shown.
          </p>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          <Field
            label="Business name"
            htmlFor="businessName"
            error={state.fieldErrors?.businessName?.[0]}
            hint="Shown in the sidebar and on your workspace header."
          >
            <Input
              id="businessName"
              name="businessName"
              defaultValue={businessName}
              maxLength={120}
              autoComplete="organization"
              aria-invalid={Boolean(state.fieldErrors?.businessName)}
            />
          </Field>

          <Field
            label="Business time zone"
            htmlFor="timezone"
            error={state.fieldErrors?.timezone?.[0]}
            hint="Appointment times, working hours, and report boundaries all use this zone."
          >
            <TimezoneSelect
              id="timezone"
              value={selectedTimezone}
              onChange={setSelectedTimezone}
              timezones={timezones}
            />
          </Field>

          <Field
            label="Currency"
            htmlFor="currencyCode"
            error={state.fieldErrors?.currencyCode?.[0]}
            hint="Used for service prices, revenue, and exported reports."
          >
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currencyCode" className="w-full">
                <SelectValue placeholder="Choose a currency" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((currencyOption) => (
                  <SelectItem key={currencyOption.code} value={currencyOption.code}>
                    {currencyOption.code} — {currencyOption.label}
                  </SelectItem>
                ))}
                {!CURRENCIES.some((option) => option.code === currencyCode) ? (
                  <SelectItem value={currencyCode}>{currencyCode}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/40 p-3 text-[11.5px] leading-relaxed text-muted-foreground">
            <Globe2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
            Daylight-saving changes are handled when local times are converted for
            storage. Existing appointments keep their actual instant.
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-border/80 px-5 py-3.5 sm:px-6">
          <SubmitButton pendingLabel="Saving settings…">Save changes</SubmitButton>
        </div>
      </div>
    </form>
  );
}
