"use client";
import * as React from "react";

type Item = { value: string; label: React.ReactNode };
type CtxType = { value: string; setValue: (v: string) => void; items: Item[]; register: (item: Item) => void; };
const Ctx = React.createContext<CtxType | null>(null);

export function Select({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  const [items, setItems] = React.useState<Item[]>([]);
  const register = (item: Item) => setItems(prev => prev.find(i => i.value === item.value) ? prev : [...prev, item]);
  return <Ctx.Provider value={{ value, setValue: onValueChange, items, register }}>{children}</Ctx.Provider>;
}
export function SelectTrigger({ children, className="" }: { children: React.ReactNode; className?: string }) {
  const ctx = React.useContext(Ctx)!;
  return (
    <div className={"rounded-2xl border h-10 flex items-center px-3 " + className}>
      <select className="bg-transparent w-full outline-none text-sm" value={ctx.value} onChange={(e) => ctx.setValue(e.target.value)}>
        {ctx.items.map((it) => (<option key={it.value} value={it.value}>{typeof it.label === "string" ? it.label : (it.value)}</option>))}
      </select>
    </div>
  );
}
export function SelectContent({ children }: { children: React.ReactNode }) { return <div style={{ display: 'none' }}>{children}</div>; }
export function SelectItem({ value, children }: { value: string; children: React.ReactNode }) {
  const ctx = React.useContext(Ctx)!; React.useEffect(() => { ctx.register({ value, label: children }); }, [value, children]); return null;
}
export function SelectValue({ placeholder }: { placeholder?: string }) { return null; }
