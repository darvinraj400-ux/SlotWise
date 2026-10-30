"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BadgeCheck,
  CalendarCheck2,
  CalendarDays,
  ChartColumnIncreasing,
  Globe2,
  LayoutDashboard,
  Plus,
  Scissors,
  Settings2,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { InitialsAvatar } from "@/components/app/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { href: "/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/appointments", label: "Appointments", icon: CalendarCheck2 },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/services", label: "Services", icon: Scissors },
      { href: "/staff", label: "Staff", icon: BadgeCheck },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/reports", label: "Reports", icon: ChartColumnIncreasing },
    ],
  },
] as const;

export type SidebarProps = {
  businessName: string;
  timezone: string;
  email: string;
};

export function SidebarContent({
  businessName,
  timezone,
  email,
  onNavigate,
}: SidebarProps & { onNavigate?: () => void }) {
  const pathname = usePathname();
  const displayName = email.split("@")[0]?.replace(/[._-]+/g, " ") ?? "Account";

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex h-full w-full flex-col bg-nav text-nav-foreground">
      <div className="px-5 pb-5 pt-6">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="inline-flex rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-nav-active focus-visible:ring-offset-2 focus-visible:ring-offset-nav"
        >
          <Logo inverted />
        </Link>

        <div className="mt-6 rounded-xl border border-nav-border bg-white/[0.035] px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-nav-muted">
            Workspace
          </p>
          <p className="mt-1.5 truncate text-[13.5px] font-medium text-nav-foreground">
            {businessName}
          </p>
          <p className="mt-1 flex items-center gap-1.5 truncate text-[11px] text-nav-muted">
            <Globe2 className="size-3 shrink-0" />
            {timezone}
          </p>
        </div>

        <Button asChild className="mt-3 w-full justify-start gap-2 bg-primary text-white hover:bg-primary/90">
          <Link href="/appointments/new" onClick={onNavigate}>
            <Plus className="size-4" />
            New appointment
          </Link>
        </Button>
      </div>

      <nav
        aria-label="Main navigation"
        className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 pb-4"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-nav-muted/80">
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-nav-active",
                        active
                          ? "bg-white/[0.08] text-white"
                          : "text-nav-muted hover:bg-white/[0.05] hover:text-nav-foreground",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[17px] shrink-0",
                          active
                            ? "text-nav-active"
                            : "text-nav-muted/80 group-hover:text-nav-foreground",
                        )}
                        strokeWidth={1.8}
                      />
                      <span>{item.label}</span>
                      {active ? (
                        <span className="ml-auto size-1.5 rounded-full bg-nav-active" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-nav-border p-3">
        <Link
          href="/settings"
          onClick={onNavigate}
          aria-current={isActive("/settings") ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-nav-active",
            isActive("/settings")
              ? "bg-white/[0.08] text-white"
              : "text-nav-muted hover:bg-white/[0.05] hover:text-nav-foreground",
          )}
        >
          <Settings2 className="size-[17px]" strokeWidth={1.8} />
          Settings
        </Link>

        <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-white/[0.035] px-3 py-2.5">
          <InitialsAvatar
            name={displayName}
            size="sm"
            className="ring-0 ring-offset-0"
          />
          <div className="min-w-0">
            <p className="truncate text-[12px] font-medium capitalize text-nav-foreground">
              {displayName}
            </p>
            <p className="truncate text-[10.5px] text-nav-muted">{email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppSidebar(props: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-nav-border lg:flex">
      <SidebarContent {...props} />
    </aside>
  );
}
