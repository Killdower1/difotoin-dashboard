import * as React from "react";
import { cn } from "@/components/ui/utils";
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn("h-10 w-full rounded-2xl border bg-transparent px-3 text-sm outline-none", className)} {...props} />
  )
);
Input.displayName = "Input";
