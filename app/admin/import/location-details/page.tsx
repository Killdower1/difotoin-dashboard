"use client";
import { useState } from "react";
export default function ImportLocationDetails(){
  const [file,setFile]=useState<File|null>(null);
  const [msg,setMsg]=useState("");
  async function submit(e:React.FormEvent){e.preventDefault(); if(!file) return; setMsg("Uploading…");
    const fd=new FormData(); fd.append("file",file);
    const r=await fetch("/api/admin/location-details/import",{method:"POST",body:fd});
    const j=await r.json(); setMsg(r.ok?`✅ ${j.count} baris tersimpan`:`❌ ${j.error||"gagal"}`);
  }
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Import Location Details</h1>
      <p className="text-sm text-muted-foreground">Kolom contoh: name, floor_or_zone, nearby_anchor, nearby_feature, signage_available, los_1to5, power_1to5, permit_1to5, notes</p>
      <form onSubmit={submit} className="mt-4 flex gap-3 items-center">
        <input type="file" accept=".csv,.xlsx,.xls" onChange={e=>setFile(e.target.files?.[0]||null)}/>
        <button className="h-10 px-4 rounded-2xl bg-white text-black text-sm font-medium">Upload</button>
      </form>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </main>
  );
}
