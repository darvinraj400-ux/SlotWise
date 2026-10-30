import Link from "next/link";
import { CalendarDays, Plus } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { MobileNavigation } from "@/components/app/mobile-navigation";
import { UserMenu } from "@/components/app/user-menu";
import { Button } from "@/components/ui/button";

export function AppTopbar({
  businessName,
  timezone,
  email,
  dateLabel,
}: {
  businessName: string;
  timezone: string;
  email: string;
  dateLabel: string;
}) {
  const sidebarProps = { businessName, timezone, email };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="flex h-16 items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <MobileNavigation {...sidebarProps} />
        <Link href="/dashboard" className="rounded-md lg:hidden" aria-label="SlotWise dashboard">
          <Logo markClassName="size-8" />
        </Link>

        <div className="hidden min-w-0 items-center gap-2.5 lg:flex">
          <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <CalendarDays className="size-3.5" />
          </span>
          <span className="max-w-[220px] truncate text-[13px] font-medium text-foreground">
            {businessName}
          </span>
          <span className="text-border" aria-hidden>
            /
          </span>
          <span className="truncate text-[12px] text-muted-foreground">{timezone}</span>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          <span className="hidden text-[12px] tabular-nums text-muted-foreground xl:inline">
            {dateLabel}
          </span>
          <Button asChild size="sm" className="hidden gap-1.5 sm:inline-flex">
            <Link href="/appointments/new">
              <Plus className="size-4" />
              New appointment
            </Link>
          </Button>
          <Button
            asChild
            size="icon"
            variant="outline"
            className="sm:hidden"
            aria-label="New appointment"
          >
            <Link href="/appointments/new">
              <Plus className="size-4" />
            </Link>
          </Button>
          <UserMenu email={email} businessName={businessName} />
        </div>
      </div>
    </header>
  );
}
