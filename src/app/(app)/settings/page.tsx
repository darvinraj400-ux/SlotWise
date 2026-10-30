import type { Metadata } from "next";
import { LogOut, Mail, ShieldCheck, Globe2 } from "lucide-react";
import { PageHeader } from "@/components/app/page-header";
import { SettingsForm } from "@/components/settings/settings-form";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth/context";
import { signOutAction } from "@/lib/actions/auth";
import { formatDateLong, getSupportedTimeZones, todayDateKey } from "@/lib/time";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const { user, settings } = await requireSession();
  const timezones = getSupportedTimeZones(settings.timezone);
  const email = user.email ?? "—";
  const today = formatDateLong(new Date(), settings.timezone);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your business identity, time zone, and currency — used consistently across SlotWise."
        eyebrow="Workspace"
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <SettingsForm
          businessName={settings.business_name}
          timezone={settings.timezone}
          currencyCode={settings.currency_code}
          timezones={timezones}
        />

        <div className="min-w-0 space-y-4">
          <section className="rounded-2xl border border-border/80 bg-card shadow-card">
            <div className="border-b border-border/80 px-5 py-4">
              <h2 className="text-[15px] font-semibold tracking-[-0.015em]">
                Account
              </h2>
            </div>
            <div className="p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Mail className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Signed in as
                  </p>
                  <p className="text-[13px] font-medium wrap-anywhere">{email}</p>
                </div>
              </div>

              <form action={signOutAction} className="mt-5">
                <Button type="submit" variant="outline" className="w-full justify-start gap-2">
                  <LogOut className="size-4" />
                  Sign out
                </Button>
              </form>
            </div>
          </section>

          <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold">
              <Globe2 className="size-4 text-primary" />
              Your current day
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {today}
              <br />
              <span className="text-[12px]">{settings.timezone}</span>
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Local date key: {todayDateKey(settings.timezone)}
            </p>
          </section>

          <section className="rounded-2xl border border-border/80 bg-muted/40 p-5">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold">
              <ShieldCheck className="size-4 text-primary" />
              Security note
            </h2>
            <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
              This workspace is isolated at the database level. Your session never
              carries a service-role key, and every record is scoped to your account.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
