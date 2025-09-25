"use client";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Preview = {
  rows: number;
  dateRange: { start: string|null; end: string|null; days: number };
  periodDetected: string;
  counts: { foto:number; unlock:number; softcopy:number; print:number; other:number };
  hourHistogram: number[];
  outletSummary: { distinct:number; matchedExact:number; matchedViaAlias:number; unmatched:number; unmatchedSamples:{name:string;count:number}[] };
  unknownTypes: {label:string; count:number}[];
};

export default function ValidatePage(){
  const [file, setFile] = useState<File|null>(null);
  const [data, setData] = useState<Preview|null>(null);
  const [msg, setMsg] = useState("");

  async function submit(e:React.FormEvent){
    e.preventDefault();
    if(!file) return;
    setMsg(" analyzing… ");
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/ingest/preview", { method:"POST", body: fd });
    const j = await r.json();
    if(r.ok){ setData(j); setMsg(""); } else { setMsg(j?.error||"preview failed"); }
  }

  function dlUnmatchedCSV(){
    if(!data) return;
    const lines = ["alias,master"];
    for(const u of data.outletSummary.unmatchedSamples){
      lines.push(`"${u.name.replaceAll('"','""')}",`);
    }
    const blob = new Blob([lines.join("\n")], { type:"text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "outlet_alias_todo.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const hourly = data ? data.hourHistogram.map((v,i)=>({hour:i, foto:v})) : [];

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold">Validation Preview</h1>
      <p className="text-sm text-muted-foreground">Cek dulu sebelum ingest: mapping event, period, dan outlet yang belum ke-map.</p>

      <form onSubmit={submit} className="mt-4 flex gap-3 items-center">
        <input type="file" accept=".csv,.xlsx,.xls" onChange={e=>setFile(e.target.files?.[0]||null)} />
        <button className="h-10 px-4 rounded-2xl bg-white text-black text-sm font-medium">Preview</button>
        {msg && <span className="text-sm">{msg}</span>}
      </form>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-5">
          <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Rows</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.rows.toLocaleString()}</div><p className="text-xs text-muted-foreground">Days: {data.dateRange.days} · Period: {data.periodDetected}</p></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Events</CardTitle></CardHeader><CardContent><p className="text-sm">Foto: <b>{data.counts.foto}</b> · Unlock: <b>{data.counts.unlock}</b> · Softcopy: <b>{data.counts.softcopy}</b> · Print: <b>{data.counts.print}</b> · Other: <b>{data.counts.other}</b></p></CardContent></Card>
          <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Outlets</CardTitle></CardHeader><CardContent><p className="text-sm">Distinct: <b>{data.outletSummary.distinct}</b> · Matched (Master): <b>{data.outletSummary.matchedExact}</b> · Via Alias: <b>{data.outletSummary.matchedViaAlias}</b> · Unmatched: <b>{data.outletSummary.unmatched}</b></p><button onClick={dlUnmatchedCSV} className="mt-2 h-9 px-3 rounded-2xl bg-white text-black text-sm">Download CSV (unmatched)</button></CardContent></Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Foto per Jam (preview)</CardTitle></CardHeader>
            <CardContent className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="hour"/><YAxis/><RTooltip/>
                  <Bar dataKey="foto" name="Foto"/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Unknown Event Labels (Top 20)</CardTitle></CardHeader>
            <CardContent className="overflow-auto max-h-[280px]">
              <Table>
                <TableHeader><TableRow><TableHead>Label</TableHead><TableHead className="text-right">Count</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.unknownTypes.map(u=>(
                    <TableRow key={u.label}>
                      <TableCell className="truncate max-w-[280px]">{u.label}</TableCell>
                      <TableCell className="text-right">{u.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Unmatched Outlets (Top 50)</CardTitle></CardHeader>
            <CardContent className="overflow-auto">
              <Table>
                <TableHeader><TableRow><TableHead>Outlet</TableHead><TableHead className="text-right">Events</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.outletSummary.unmatchedSamples.map(u=>(
                    <TableRow key={u.name}>
                      <TableCell className="truncate max-w-[520px]">{u.name}</TableCell>
                      <TableCell className="text-right">{u.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
