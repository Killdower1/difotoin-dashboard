import * as React from "react";
import { cn } from "@/components/ui/utils";

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "secondary" | "destructive" | "outline" }) {
  const variants = {
    default: "bg-white text-black",
    secondary: "bg-neutral-800 text-white",
    destructive: "bg-red-600 text-white",
    outline: "border border-border",
  } as const;
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px]", variants[variant], className)} {...props} />;
}
