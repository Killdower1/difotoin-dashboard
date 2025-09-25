"use client";
import React from "react";

type TrendItem = { name:string; foto:number; prevFoto:number; deltaFotoPct:number; unlock:number; prevUnlock:number; deltaUnlockPct:number };
type Resp = { period:string; prevPeriod:string|null; risers:TrendItem[]; decliners:TrendItem[]; };

function fmtPct(n:number){ if(n===0) return "0%"; const v = (n*100).toFixed(0); return (n>0?"+":"") + v + "%"; }
function fmtNum(n:number){ return (n||0).toLocaleString("id-ID"); }

export default function TrendsPage(){
  const [period, setPeriod] = React.useState<string>("latest");
  const [data, setData] = React.useState<Resp|null>(null);
  const [msg, setMsg] = React.useState<string>("");

  async function load(p:string){
    setMsg("Loading...");
    try{
      const r = await fetch("/api/metrics/trends?period=" + encodeURIComponent(p), { cache:"no-store" });
      const j = await r.json();
      setData(j); setMsg("");
    }catch(e:any){ setMsg("Gagal load: " + String(e?.message||e)); }
  }
  React.useEffect(()=>{ load(period); },[period]);

  return (
    <main className="p-4 md:p-6 space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tren Kategori Outlet</h1>
          <p className="text-sm opacity-80">Perbandingan periode sekarang vs bulan sebelumnya (MoM). Sumber: venueParent/venueType.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e=>setPeriod(e.target.value)} className="h-9 rounded-xl border bg-transparent px-3 text-sm">
            <option value="latest">latest (snapshot)</option>
            <option value="2025-09">2025-09</option>
            <option value="2025-08">2025-08</option>
            <option value="2025-07">2025-07</option>
            <option value="2025-06">2025-06</option>
          </select>
          <button onClick={()=>load(period)} className="h-9 rounded-xl border text-sm px-3">Refresh</button>
        </div>
      </header>

      {msg && <div className="text-sm">{msg}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Risers */}
        <section className="rounded-2xl border">
          <div className="px-4 py-3 border-b">
            <div className="text-lg font-medium">Kategori Meningkat</div>
            <div className="text-xs opacity-70">Top 10 berdasarkan pertumbuhan Foto (MoM)</div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-right">Foto</th>
                  <th className="p-3 text-right">Prev</th>
                  <th className="p-3 text-right">Δ Foto</th>
                  <th className="p-3 text-right">Unlock</th>
                  <th className="p-3 text-right">Δ Unlock</th>
                </tr>
              </thead>
              <tbody>
                {(data?.risers||[]).map(it=>(
                  <tr key={"r-"+it.name} className="border-t">
                    <td className="p-3">{it.name}</td>
                    <td className="p-3 text-right">{fmtNum(it.foto)}</td>
                    <td className="p-3 text-right">{fmtNum(it.prevFoto)}</td>
                    <td className="p-3 text-right">{fmtPct(it.deltaFotoPct)}</td>
                    <td className="p-3 text-right">{fmtNum(it.unlock)}</td>
                    <td className="p-3 text-right">{fmtPct(it.deltaUnlockPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Decliners */}
        <section className="rounded-2xl border">
          <div className="px-4 py-3 border-b">
            <div className="text-lg font-medium">Kategori Menurun</div>
            <div className="text-xs opacity-70">Top 10 berdasarkan penurunan Foto (MoM)</div>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-right">Foto</th>
                  <th className="p-3 text-right">Prev</th>
                  <th className="p-3 text-right">Δ Foto</th>
                  <th className="p-3 text-right">Unlock</th>
                  <th className="p-3 text-right">Δ Unlock</th>
                </tr>
              </thead>
              <tbody>
                {(data?.decliners||[]).map(it=>(
                  <tr key={"d-"+it.name} className="border-t">
                    <td className="p-3">{it.name}</td>
                    <td className="p-3 text-right">{fmtNum(it.foto)}</td>
                    <td className="p-3 text-right">{fmtNum(it.prevFoto)}</td>
                    <td className="p-3 text-right">{fmtPct(it.deltaFotoPct)}</td>
                    <td className="p-3 text-right">{fmtNum(it.unlock)}</td>
                    <td className="p-3 text-right">{fmtPct(it.deltaUnlockPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="text-xs opacity-70">
        Catatan: kategori dengan basis sangat kecil (foto &lt; 50) diabaikan agar persentase tidak menyesatkan.
      </div>
    </main>
  );
}
