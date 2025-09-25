"use client";
import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [period, setPeriod] = useState<string>(""); // YYYY-MM
  const [setLatest, setSetLatest] = useState<boolean>(false);
  const [msg, setMsg] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setMsg("Uploading…");
    const fd = new FormData();
    fd.append("file", file);
    if (period) fd.append("period", period);
    if (setLatest) fd.append("setLatest", "1");
    const res = await fetch("/api/ingest", { method: "POST", body: fd });
    const j = await res.json();
    setMsg(res.ok ? `✅ ${j.period}: ${j.rows} rows, ${j.outlets} outlets` : `❌ ${j.error || "gagal"}`);
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Upload Data Bulanan</h1>
      <p className="text-sm text-muted-foreground">CSV/XLSX — minimal kolom tanggal, event, outlet.</p>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3 max-w-xl">
        <label className="text-sm">
          Period (YYYY-MM) — opsional
          <input type="month" value={period} onChange={(e)=>setPeriod(e.target.value)} className="mt-1 h-10 w-full rounded-2xl border bg-transparent px-3 text-sm outline-none"/>
        </label>
        <label className="text-sm inline-flex items-center gap-2">
          <input type="checkbox" checked={setLatest} onChange={(e)=>setSetLatest(e.target.checked)} />
          Set as latest snapshot
        </label>
        <input type="file" accept=".csv,.xlsx,.xls" onChange={(e)=>setFile(e.target.files?.[0] || null)} />
        <button className="h-10 px-4 rounded-2xl bg-white text-black text-sm font-medium">Upload & Process</button>
      </form>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </main>
  );
}
