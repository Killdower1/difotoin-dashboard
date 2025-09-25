"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from "recharts";

type Detail = {
  outlet:string; area?:string; venueType?:string; indoorOutdoor?:string;
  foto:number; unlock:number; print:number; activeRatio:number;
  weekendShare?:number; eveningPeakShare?:number; class:string;
  hourProfile:number[]; location?: any;
  dailySeries?: Array<{date:string,foto:number,unlock:number,print:number}>;
};

export default function OutletDetail({ params }: { params: { slug: string } }) {
  const sp = useSearchParams();
  const period = sp.get("period") || "latest";
  const [data,setData] = useState<Detail | null>(null);

  useEffect(()=>{ (async()=>{
    const r = await fetch(`/api/metrics/outlets/${encodeURIComponent(params.slug)}?period=${period}`, { cache:"no-store" });
    if (r.ok) setData(await r.json());
  })(); }, [params.slug, period]);

  if (!data) return <main className="p-6">Loading…</main>;
  const conv = data.foto ? data.unlock/data.foto : 0;
  const hourly = data.hourProfile.map((v,i)=>({hour:i, foto:v}));
  const daily = (data.dailySeries||[]).map(d=>({date:d.date, foto:d.foto, unlock:d.unlock, print:d.print}));

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{decodeURIComponent(params.slug)}</h1>
        <Link href={`/dashboard?period=${period}`} className="underline text-sm">← Back to Dashboard</Link>
      </div>
      <p className="text-sm text-muted-foreground">{data.area || "-"} · {data.venueType || "-"} · {data.indoorOutdoor || "-"}</p>
      {data.location?.floor_or_zone && <p className="text-sm">Zone: {data.location.floor_or_zone} · Anchor: {data.location.nearby_anchor} · Feature: {data.location.nearby_feature}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
        <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Foto</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.foto.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Unlock</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.unlock.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Conversion</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{(conv*100).toFixed(0)}%</div></CardContent></Card>
        <Card><CardHeader className="pb-1"><CardTitle className="text-sm">Evening Peak</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{((data.eveningPeakShare||0)*100).toFixed(0)}%</div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Foto per Jam</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <RTooltip />
                <Bar dataKey="foto" name="Foto" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Trend</CardTitle></CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Legend />
                <RTooltip />
                <Line type="monotone" dataKey="foto" />
                <Line type="monotone" dataKey="unlock" />
                <Line type="monotone" dataKey="print" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
