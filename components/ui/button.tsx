import * as React from "react";
import { cn } from "@/components/ui/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "secondary";
  size?: "sm" | "md";
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size="md", ...props }, ref) => {
    const base = "inline-flex items-center justify-center rounded-2xl font-medium transition-colors border";
    const variants = {
      default: "bg-white text-black hover:opacity-90 border-transparent",
      outline: "bg-transparent text-foreground border-border hover:bg-white/5",
      secondary: "bg-neutral-800 text-white hover:bg-neutral-700 border-transparent",
    } as const;
    const sizes = { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-sm" } as const;
    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props} />
    );
  }
);
Button.displayName = "Button";
