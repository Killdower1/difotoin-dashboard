"use client";
import * as React from "react";
export function TooltipProvider({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function Tooltip({ children }: { children: React.ReactNode }) { return <>{children}</>; }
export function TooltipContent({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <span data-tooltip-content className={className} style={{ display: "none" }}>{typeof children === "string" ? children : ""}</span>;
}
export function TooltipTrigger({ children, asChild = false }: { children: React.ReactElement; asChild?: boolean }) {
  return React.cloneElement(children, {});
}
