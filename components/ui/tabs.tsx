"use client";
import * as React from "react";

type TabsCtx = { value: string; setValue: (v: string) => void };
const Ctx = React.createContext<TabsCtx | null>(null);

export function Tabs({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  return <Ctx.Provider value={{ value, setValue: onValueChange }}>{children}</Ctx.Provider>;
}
export function TabsList({ children, className="" }: { children: React.ReactNode; className?: string }) {
  return <div className={"inline-grid gap-1 bg-white/5 p-1 rounded-xl " + className}>{children}</div>;
}
export function TabsTrigger({ value, children, className="" }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(Ctx)!;
  const active = ctx.value === value;
  return (
    <button onClick={() => ctx.setValue(value)} className={"px-3 py-1 rounded-lg text-xs " + (active ? "bg-white text-black" : "text-foreground") + " " + className}>
      {children}
    </button>
  );
}
export function TabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(Ctx)!;
  if (ctx.value !== value) return null;
  return <div className="mt-2">{children}</div>;
}
