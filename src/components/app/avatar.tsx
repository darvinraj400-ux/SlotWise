import { cn, initials } from "@/lib/utils";

const PALETTES = [
  "bg-teal-50 text-teal-800 ring-teal-600/10",
  "bg-indigo-50 text-indigo-800 ring-indigo-600/10",
  "bg-amber-50 text-amber-800 ring-amber-600/10",
  "bg-rose-50 text-rose-800 ring-rose-600/10",
  "bg-slate-100 text-slate-700 ring-slate-600/10",
] as const;

function paletteFor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return PALETTES[hash % PALETTES.length]!;
}

export function InitialsAvatar({
  name,
  className,
  size = "default",
}: {
  name: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold uppercase ring-1 ring-inset",
        paletteFor(name),
        size === "sm" && "size-7 text-[10px]",
        size === "default" && "size-9 text-[11px]",
        size === "lg" && "size-12 text-sm",
        className,
      )}
      aria-hidden="true"
    >
      {initials(name) || "?"}
    </span>
  );
}
