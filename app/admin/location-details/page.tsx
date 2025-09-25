"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

type Row = {
  name:string; floor_or_zone?:string; nearby_anchor?:string; nearby_feature?:string;
  signage_available?:string; los_1to5?:number; power_1to5?:number; permit_1to5?:number; notes?:string;
};

export default function LocationDetailsList(){
  const [rows,setRows]=useState<Row[]>([]);
  const [msg,setMsg]=useState("");

  async function load(){ const r=await fetch("/api/admin/location-details",{cache:"no-store"}); if(r.ok){ setRows(await r.json()); } }
  useEffect(()=>{ load(); },[]);

  async function del(name:string){
    if(!confirm(`Delete "${name}"?`)) return;
    const r = await fetch("/api/admin/location-details/delete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name})});
    const j = await r.json(); setMsg(j.ok? "Deleted" : (j.error||"Failed")); await load();
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Location Details</h1>
        <Link href="/admin/location-details/new" className="underline text-sm">+ New</Link>
      </div>
      {msg && <p className="text-sm mt-2">{msg}</p>}
      <Card className="mt-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Catatan titik (floor/anchor/LOS/power/permit)</CardTitle></CardHeader>
        <CardContent className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Zone</TableHead><TableHead>Anchor</TableHead><TableHead>Feature</TableHead><TableHead>LOS</TableHead><TableHead>Power</TableHead><TableHead>Permit</TableHead><TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r=>(
                <TableRow key={r.name}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>{r.floor_or_zone||"-"}</TableCell>
                  <TableCell>{r.nearby_anchor||"-"}</TableCell>
                  <TableCell>{r.nearby_feature||"-"}</TableCell>
                  <TableCell>{r.los_1to5 ?? "-"}</TableCell>
                  <TableCell>{r.power_1to5 ?? "-"}</TableCell>
                  <TableCell>{r.permit_1to5 ?? "-"}</TableCell>
                  <TableCell className="text-right space-x-3">
                    <Link className="underline text-sm" href={`/admin/location-details/${encodeURIComponent(r.name)}`}>Edit</Link>
                    <button onClick={()=>del(r.name)} className="text-sm underline opacity-70">Delete</button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4 text-sm">
        <Link className="underline" href="/admin/import/location-details">Import CSV</Link>
      </div>
    </main>
  );
}
