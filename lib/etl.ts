import * as XLSX from "xlsx";

export type Event = { ID: string; Tanggal: string | Date; Tipe: string; Outlet: string };

export type OutletMetric = {
  outlet: string;
  area?: string; venueType?: string; indoorOutdoor?: string;
  foto: number; unlock: number; print: number;
  activeRatio: number; weekendShare: number; eveningPeakShare: number;
  class: string;
  hourProfile: number[]; // 0..23 foto per jam
};

function toLowerSafe(s: any) { return (typeof s === "string" ? s.trim().toLowerCase() : ""); }

// ✦ NORMALISASI TIPE EVENT (tahan berbagai istilah ID/EN)
function normType(t: string) {
  const x = toLowerSafe(t);
  // UNLOCK / TRANSAKSI / BAYAR / ORDER / CHECKOUT / SUCCESS
  if (/(unlock|payment|paid|bayar|transaksi|trx|order|checkout|success|sukses)/.test(x)) return "unlock";
  // PRINT / CETAK / REPRINT / ADD PRINT / EXTRA PRINT
  if (/(print|cetak|reprint|add[-_ ]?print|extra[-_ ]?print)/.test(x)) return "print";
  // FOTO / PHOTO / CAPTURE / SNAP / AMBIL / CAMERA
  if (/(foto|photo|take[-_ ]?photo|capture|snap|shutter|ambil[-_ ]?foto|camera)/.test(x)) return "foto";
  // SOFTCOPY → anggap transaksi digital (masuk unlock)
  if (/(soft ?copy)/.test(x)) return "softcopy";
  return "other";
}

// ✦ PARSER: fleksibel nama kolom
export function parseSheetToEvents(buf: ArrayBuffer): Event[] {
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: null });

  const pick = (r:any, keys:string[]) => {
    for (const k of keys) if (r[k] != null && String(r[k]).trim() !== "") return r[k];
    return null;
  };

  return rows.map((r, i) => ({
    ID: String(pick(r, ["ID","Id","id"]) ?? i),
    Tanggal: pick(r, ["Tanggal","tanggal","Datetime","datetime","Date","date","Created At","created_at","Timestamp","timestamp","Time","time","ts"]),
    Tipe: pick(r, ["Tipe","tipe","Type","type","Event","event","Action","action","Nama Event","NamaEvent","Jenis","jenis","Status","status","Step","step","Stage","stage"]),
    Outlet: pick(r, ["Outlet","outlet","Location","location","Outlet Name","OutletName","Nama Outlet","nama_outlet","Mesin","mesin","Device","device","Kiosk","kiosk"]),
  }))
  .filter(r => r.Tanggal && r.Tipe && r.Outlet);
}

// ✦ DETEK PERIODE (YYYY-MM) dari tanggal data
export function detectPeriod(evts: Event[]): string {
  const ds = evts.map(e => new Date(e.Tanggal as any)).filter(d => !isNaN(d.getTime()));
  if (!ds.length) return "unknown";
  ds.sort((a,b)=>a.getTime()-b.getTime());
  const d = ds[0];
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
}

// ✦ AGREGASI: outlet metrics + daily + hour profile
export function aggregateAll(evts: Event[]): {
  outlets: OutletMetric[];
  dailyByOutlet: Record<string, Array<{date:string, foto:number, unlock:number, print:number}>>;
} {
  const byOutlet = new Map<string, {
    foto:number; unlock:number; print:number;
    days:Set<string>; weekendCt:number; totalCt:number; eveningCt:number; fotoHours:number;
    hours:number[]; daily: Map<string,{foto:number;unlock:number;print:number}>;
  }>();
  const allDates = new Set<string>();

  for (const e of evts) {
    const d = new Date(e.Tanggal as any);
    if (isNaN(d.getTime())) continue;
    const day = d.toISOString().slice(0,10);
    const hour = d.getHours();
    const dow = d.getDay();
    const t = normType(String(e.Tipe));
    const key = String(e.Outlet).trim() || "Unknown";

    if (!byOutlet.has(key)) byOutlet.set(key, {
      foto:0, unlock:0, print:0, days:new Set(), weekendCt:0, totalCt:0, eveningCt:0, fotoHours:0,
      hours:Array(24).fill(0), daily:new Map()
    });
    const o = byOutlet.get(key)!;

    o.days.add(day);
    o.totalCt += 1;
    if (dow === 0 || dow === 6) o.weekendCt += 1;

    if (t === "foto") { o.foto += 1; o.hours[hour] += 1; o.fotoHours += 1; if(hour>=17 && hour<=21) o.eveningCt += 1; }
    else if (t === "unlock" || t === "softcopy") o.unlock += 1;
    else if (t === "print") o.print += 1;

    const drow = o.daily.get(day) || { foto:0, unlock:0, print:0 };
    if (t === "foto") drow.foto += 1;
    if (t === "unlock" || t === "softcopy") drow.unlock += 1;
    if (t === "print") drow.print += 1;
    o.daily.set(day, drow);

    allDates.add(day);
  }

  const totalDays = allDates.size || 1;
  const rows = Array.from(byOutlet.entries()).map(([outlet, v]) => {
    const activeRatio = v.days.size / totalDays;
    const weekendShare = v.totalCt ? v.weekendCt / v.totalCt : 0;
    const eveningPeakShare = v.fotoHours ? v.eveningCt / v.fotoHours : 0;
    return { outlet, foto: v.foto, unlock: v.unlock, print: v.print, activeRatio, weekendShare, eveningPeakShare, hourProfile: v.hours } as any;
  });

  // klasifikasi (quantile 60/40)
  const fotos = rows.map((r:any)=>r.foto).sort((a:number,b:number)=>a-b);
  const convs = rows.map((r:any)=> (r.foto>0? r.unlock/r.foto : 0)).sort((a:number,b:number)=>a-b);
  const q = (arr:number[], p:number)=> arr.length ? arr[Math.min(arr.length-1, Math.floor(p*(arr.length-1)))] : 0;
  const fotoHigh = q(fotos, 0.60), fotoLow = q(fotos, 0.40);
  const convHigh = q(convs, 0.60), convLow = q(convs, 0.40);

  const outlets: OutletMetric[] = rows.map((r:any) => {
    const conv = r.foto>0? r.unlock/r.foto : 0;
    let label = "monitor";
    if (r.foto >= fotoHigh && conv >= convHigh) label = "keeper";
    else if (r.foto >= fotoHigh && conv <= convLow) label = "optimize-conversion";
    else if (r.foto <= fotoLow && conv <= convLow) label = "relocate-candidate";
    else if (r.activeRatio < 0.5) label = "check-uptime/ops";
    return { ...r, class: label };
  });

  const dailyByOutlet: Record<string, Array<{date:string,foto:number,unlock:number,print:number}>> = {};
  for (const [name, v] of byOutlet.entries()) {
    const rows = Array.from(v.daily.entries()).map(([date, s]) => ({ date, ...s })).sort((a,b)=> a.date.localeCompare(b.date));
    dailyByOutlet[name] = rows;
  }

  return { outlets, dailyByOutlet };
}
