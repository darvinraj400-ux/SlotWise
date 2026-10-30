"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function AutoFilterSelect({
  paramKey,
  value,
  placeholder,
  options,
  className,
  allLabel = "All",
}: {
  paramKey: string;
  value: string | undefined;
  placeholder: string;
  options: { value: string; label: string }[];
  className?: string;
  allLabel?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") params.delete(paramKey);
    else params.set(paramKey, next);
    params.delete("page");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <Select value={value ?? "all"} onValueChange={handleChange}>
      <SelectTrigger
        aria-label={placeholder}
        className={cn("h-9 w-auto min-w-[150px] bg-card", className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
