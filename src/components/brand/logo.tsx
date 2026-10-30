import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={cn("size-9 shrink-0", className)}
      fill="none"
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M8.75 12.4h14.5"
        stroke="white"
        strokeOpacity=".45"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect x="9.1" y="15.8" width="5.9" height="5.9" rx="1.6" fill="white" />
      <rect
        x="17"
        y="15.8"
        width="5.9"
        height="5.9"
        rx="1.6"
        fill="white"
        fillOpacity=".5"
      />
      <circle cx="10.2" cy="8.8" r="1.05" fill="white" fillOpacity=".8" />
      <circle cx="21.8" cy="8.8" r="1.05" fill="white" fillOpacity=".8" />
    </svg>
  );
}

export function Logo({
  className,
  markClassName,
  inverted = false,
  wordmark = true,
}: {
  className?: string;
  markClassName?: string;
  inverted?: boolean;
  wordmark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <BrandMark className={markClassName} />
      {wordmark ? (
        <span
          className={cn(
            "text-[17px] font-semibold tracking-[-0.03em]",
            inverted ? "text-nav-foreground" : "text-foreground",
          )}
        >
          SlotWise
        </span>
      ) : null}
    </span>
  );
}
