import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "node:path";
import { parseSheetToEvents } from "@/lib/etl";

function normType(t:string){
  const x = String(t||"").trim().toLowerCase();
  if (/(unlock|payment|paid|bayar|transaksi|trx|order|checkout|success|sukses)/.test(x)) return "unlock";
  if (/(print|cetak|reprint|add[-_ ]?print|extra[-_ ]?print)/.test(x)) return "print";
  if (/(foto|photo|take[-_ ]?photo|capture|snap|shutter|ambil[-_ ]?foto|camera)/.test(x)) return "foto";
  if (/(soft ?copy)/.test(x)) return "softcopy";
  return "other";
}

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const file = fd.get("file") as File | null;
  if (!file) return Response.json({ error: "no file" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());

  // parse rows
const __v_any: any = buf as any; 
let __ab: ArrayBuffer; 
if (__v_any && __v_any.buffer && typeof __v_any.byteOffset === "number" && typeof __v_any.byteLength === "number") { 
  __ab = __v_any.buffer.slice(__v_any.byteOffset, __v_any.byteOffset + __v_any.byteLength); 
} else { 
  __ab = __v_any as ArrayBuffer; 
} 
const evts = parseSheetToEvents(__ab);

  // coverage tanggal & jam
  let minD: Date | null = null, maxD: Date | null = null;
  const days = new Set<string>();
  const hourHist = Array(24).fill(0);
  const typeRawCount = new Map<string, number>();
  const counts = { foto:0, unlock:0, softcopy:0, print:0, other:0 };

  // outlet matching info
  const root = process.cwd();
  async function loadJson(p:string){ try{ const b=await readFile(p,"utf8"); return JSON.parse(b);}catch{ return null; } }
  const masters:any[] = (await loadJson(path.join(root,"data","outlets_master.json"))) || [];
  const aliases:any[] = (await loadJson(path.join(root,"data","outlet_alias.json"))) || [];
  const masterSet = new Set<string>(masters.map((m:any)=>String(m.name||"").trim()));
  const aliasMap = new Map<string,string>(); for(const a of aliases){ aliasMap.set(String(a.alias).trim(), String(a.master).trim()); }

  const outletFreqRaw = new Map<string, number>();
  const matchedExact = new Set<string>();
  const matchedAlias = new Set<string>();
  const unmatched = new Map<string, number>();

  for (const e of evts) {
    const d = new Date(e.Tanggal as any);
    if (!isNaN(d.getTime())) {
      const iso = d.toISOString().slice(0,10);
      days.add(iso);
      if (!minD || d < minD) minD = d;
      if (!maxD || d > maxD) maxD = d;
    }
    const t = normType(String(e.Tipe));
    // count types
    // @ts-ignore
    if (counts[t] != null) (counts as any)[t] += 1; else counts.other += 1;
    if (t === "foto" && !isNaN(d.getTime())) hourHist[d.getHours()] += 1;

    // raw type tally for unknowns
    const tr = String(e.Tipe||"").trim();
    typeRawCount.set(tr, (typeRawCount.get(tr)||0) + 1);

    // outlet matching
    const raw = String(e.Outlet||"").trim();
    outletFreqRaw.set(raw, (outletFreqRaw.get(raw)||0) + 1);
    if (masterSet.has(raw)) matchedExact.add(raw);
    else if (aliasMap.has(raw)) matchedAlias.add(raw);
    else unmatched.set(raw, (unmatched.get(raw)||0) + 1);
  }

  // top unknown types (that map to "other")
  const unknownTypes = Array.from(typeRawCount.entries())
    .filter(([k]) => normType(k) === "other")
    .sort((a,b)=> b[1]-a[1])
    .slice(0,20)
    .map(([label,count])=>({label, count}));

  // unmatched outlets (top)
  const unmatchedList = Array.from(unmatched.entries()).sort((a,b)=> b[1]-a[1]).slice(0,50)
    .map(([name,count])=>({name, count}));

  return Response.json({
    rows: evts.length,
    dateRange: {
      start: minD ? minD.toISOString() : null,
      end: maxD ? maxD.toISOString() : null,
      days: days.size
    },
    periodDetected: minD ? `${minD.getFullYear()}-${String(minD.getMonth()+1).padStart(2,"0")}` : "unknown",
    counts,
    hourHistogram: hourHist,
    outletSummary: {
      distinct: outletFreqRaw.size,
      matchedExact: matchedExact.size,
      matchedViaAlias: matchedAlias.size,
      unmatched: unmatched.size,
      unmatchedSamples: unmatchedList
    },
    unknownTypes
  });
}
