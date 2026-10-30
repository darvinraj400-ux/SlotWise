import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SlotWise — Appointments, without the chaos",
    template: "%s · SlotWise",
  },
  description:
    "SlotWise is a calm, calendar-first appointment and customer management platform for salons, studios, repair shops, and consultants.",
  applicationName: "SlotWise",
  keywords: ["appointments", "scheduling", "salon software", "customer management", "calendar"],
  openGraph: {
    title: "SlotWise — Appointments, without the chaos",
    description:
      "Manage customers, services, staff schedules, and appointments from one considered workspace.",
    type: "website",
    siteName: "SlotWise",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1526",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn("font-sans", sans.variable, serif.variable)}
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        {children}
        <Toaster position="bottom-right" closeButton />
      </body>
    </html>
  );
}
