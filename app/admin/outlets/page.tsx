"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

type Outlet = { name:string; area?:string; venueType?:string; venueParent?:string; venueSubType?:string; indoorOutdoor?:string };

export default function AdminOutlets(){
  const [rows,setRows]=useState<Outlet[]>([]);
  const [msg,setMsg]=useState("");
  const [period,setPeriod]=useState("");

  async function load(){ const r=await fetch("/api/admin/outlets",{cache:"no-store"}); if(r.ok){ setRows(await r.json()); } }
  useEffect(()=>{ load(); },[]);

  async function del(name:string){
    if(!confirm('Delete "' + name + '"?')) return;
    const r = await fetch("/api/admin/outlets/delete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name})});
    const j = await r.json(); setMsg(r.ok? "Deleted" : (j.error||"Failed")); await load();
  }

  async function sync(p?:string){
    setMsg("Syncing…");
    const r = await fetch("/api/admin/outlets/sync",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({period:p||"latest"})});
    const j = await r.json(); setMsg(r.ok? ("Synced (" + j.added + " added) from " + j.period) : (j.error||"Failed"));
    await load();
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Outlet Master</h1>
        <div className="flex items-center gap-3">
          <input value={period} onChange={e=>setPeriod(e.target.value)} placeholder="YYYY-MM" className="h-10 w-[120px] rounded-2xl border bg-transparent px-3 text-sm" />
          <button onClick={()=>sync(period||undefined)} className="h-10 px-3 rounded-2xl bg-white text-black text-sm">Sync from Period</button>
          <button onClick={()=>sync()} className="h-10 px-3 rounded-2xl bg-white text-black text-sm">Sync from Latest</button>
          <Link href="/admin/outlets/new" className="underline text-sm">+ New</Link>
        </div>
      </div>
      {msg && <p className="text-sm mt-2">{msg}</p>}

      <Card className="mt-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Data referensi Area/Parent/SubType/IO</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Venue Parent</TableHead>
                <TableHead>SubType</TableHead>
                <TableHead>Indoor/Outdoor</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r=>(
                <TableRow key={r.name}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.area||"-"}</TableCell>
                  <TableCell>{r.venueParent || r.venueType || "-"}</TableCell>
                  <TableCell>{r.venueSubType || "-"}</TableCell>
                  <TableCell>{r.indoorOutdoor||"-"}</TableCell>
                  <TableCell className="text-right space-x-3">
                    <Link className="underline text-sm" href={"/admin/outlets/" + encodeURIComponent(r.name)}>Edit</Link>
                    <button onClick={()=>del(r.name)} className="text-sm underline opacity-70">Delete</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 text-sm">
        <Link className="underline" href="/admin/import/outlets">Import CSV</Link>
        <span className="mx-2">·</span>
        <Link className="underline" href="/admin/import/aliases">Import Alias</Link>
        <span className="mx-2">·</span>
        <Link className="underline" href="/admin/location-details">Location Details</Link>
      </div>
    </main>
  );
}
