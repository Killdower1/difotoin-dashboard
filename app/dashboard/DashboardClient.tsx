"use client";

import React from "react";

type OutletRow = {
  id: string;
  name: string;
  foto: number;
  conversion: number;      // persen (0-100)
  activeRatio: number;     // persen (0-100)
  status: string;
};

const nf = new Intl.NumberFormat("id-ID"); // konsisten server & client
const pf = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

export default function DashboardClient({ outlets = [] as OutletRow[] }: { outlets: OutletRow[] }) {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-sm opacity-80">Client component — render data dari server.</p>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-3 py-2 text-left">Outlet</th>
              <th className="border px-3 py-2 text-right">Foto</th>
              <th className="border px-3 py-2 text-right">Conversion</th>
              <th className="border px-3 py-2 text-right">Active Ratio</th>
              <th className="border px-3 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {outlets.map((o) => (
              <tr key={o.id} className="odd:bg-white even:bg-gray-50">
                <td className="border px-3 py-2">{o.name}</td>
                <td className="border px-3 py-2 text-right">{nf.format(o.foto)}</td>
                <td className="border px-3 py-2 text-right">{pf.format(o.conversion)}%</td>
                <td className="border px-3 py-2 text-right">{pf.format(o.activeRatio)}%</td>
                <td className="border px-3 py-2">
                  <span
                    className={
                      "inline-block rounded px-2 py-1 text-xs font-medium " +
                      (o.status === "Keeper"
                        ? "bg-green-600 text-white"
                        : o.status === "Check Uptime/Ops"
                        ? "bg-red-600 text-white"
                        : o.status === "Optimize Conversion"
                        ? "bg-yellow-500 text-white"
                        : o.status === "Relocate"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-600 text-white")
                    }
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
            {outlets.length === 0 && (
              <tr>
                <td className="border px-3 py-6 text-center" colSpan={5}>
                  (Belum ada data)
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs opacity-60">
        Ubah ambang di <code>/admin/thresholds</code> lalu refresh halaman ini untuk lihat efeknya.
      </p>
    </div>
  );
}
