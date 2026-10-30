import "server-only";

import { requireSession } from "@/lib/auth/context";
import { formatZoned } from "@/lib/time";
import { AppSidebar } from "@/components/app/sidebar";
import { AppTopbar } from "@/components/app/topbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, settings } = await requireSession();

  const email = user.email ?? "owner@slotwise.local";
  const dateLabel = formatZoned(new Date(), settings.timezone, "EEE, MMM d");

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to content
      </a>
      <AppSidebar
        businessName={settings.business_name}
        timezone={settings.timezone}
        email={email}
      />
      <div className="min-h-dvh lg:pl-[264px]">
        <AppTopbar
          businessName={settings.business_name}
          timezone={settings.timezone}
          email={email}
          dateLabel={dateLabel}
        />
        <main id="main-content" className="min-h-[calc(100dvh-4rem)]">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
