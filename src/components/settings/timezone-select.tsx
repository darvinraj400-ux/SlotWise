"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function TimezoneSelect({
  value,
  onChange,
  timezones,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  timezones: string[];
  id?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-9 w-full justify-between bg-transparent font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <Globe2 className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{value || "Select a time zone"}</span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search time zones…" />
          <CommandList className="max-h-72">
            <CommandEmpty>No time zone found.</CommandEmpty>
            <CommandGroup>
              {timezones.map((timezone) => (
                <CommandItem
                  key={timezone}
                  value={timezone}
                  onSelect={() => {
                    onChange(timezone);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4",
                      timezone === value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {timezone}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
