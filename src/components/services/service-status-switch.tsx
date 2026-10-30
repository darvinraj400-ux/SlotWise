"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setServiceActiveAction } from "@/lib/actions/services";

export function ServiceStatusSwitch({
  serviceId,
  isActive,
  name,
}: {
  serviceId: string;
  isActive: boolean;
  name: string;
}) {
  const [checked, setChecked] = useState(isActive);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleChange(next: boolean) {
    setChecked(next);
    startTransition(async () => {
      const result = await setServiceActiveAction(serviceId, next);
      if (!result.ok) {
        setChecked(!next);
        toast.error(result.message);
        return;
      }
      toast.success(next ? "Service activated." : "Service deactivated.");
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={checked}
        onCheckedChange={handleChange}
        disabled={pending}
        aria-label={`${checked ? "Deactivate" : "Activate"} ${name}`}
      />
      <span className="text-[12px] text-muted-foreground">
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : checked ? "Active" : "Inactive"}
      </span>
    </div>
  );
}
