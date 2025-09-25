import * as React from "react";
export function Table({ children }: { children: React.ReactNode }) { return <table className="w-full text-sm">{children}</table>; }
export function TableHeader({ children }: { children: React.ReactNode }) { return <thead className="bg-white/5">{children}</thead>; }
export function TableBody({ children }: { children: React.ReactNode }) { return <tbody className="[&_tr:nth-child(odd)]:bg-white/0 [&_tr:nth-child(even)]:bg-white/5">{children}</tbody>; }
export function TableRow({ children }: { children: React.ReactNode }) { return <tr className="border-b border-border">{children}</tr>; }
export function TableHead({ children, className="" }: { children: React.ReactNode, className?: string }) { return <th className={"p-3 text-left font-medium " + className}>{children}</th>; }
export function TableCell({ children, className="" }: { children: React.ReactNode, className?: string }) { return <td className={"p-3 " + className}>{children}</td>; }
