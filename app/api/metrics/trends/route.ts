import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

async function exists(p:string){ try{ await stat(p); return true; }catch{ return false; } }
function z(n:number){ return String(n).padStart(2,"0"); }
function prevMonth(p:string){
  const m = /^(\d{4})-(\d{2})$/.exec(p);
  if(!m) return null;
  const y = Number(m[1]); const mm = Number(m[2]);
  const d = new Date(y, mm-2, 1);
  return d.getFullYear() + "-" + z(d.getMonth()+1);
}

async function loadMetrics(period:string){
  const root = process.cwd();
  const p = period === "latest"
    ? path.join(root,"data","metrics_outlets.json")
    : path.join(root,"data","periods",period,"metrics_outlets.json");
  try{
    const b = await readFile(p,"utf8");
    return JSON.parse(b);
  }catch{ return []; }
}

function groupByCategory(rows:any[]){
  const out = new Map<string, {name:string; foto:number; unlock:number; print:number}>();
  for(const r of rows||[]){
    const key = String(r?.venueParent ?? r?.venueType ?? "unknown");
    const cur = out.get(key) || { name:key, foto:0, unlock:0, print:0 };
    cur.foto   += Number(r?.foto||0);
    cur.unlock += Number(r?.unlock||0);
    cur.print  += Number(r?.print||0);
    out.set(key, cur);
  }
  return Array.from(out.values());
}

export async function GET(req: NextRequest){
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "latest";
  let prev = url.searchParams.get("prev");
  if(!prev && period!=="latest"){ prev = prevMonth(period) || ""; }

  const curRows  = await loadMetrics(period);
  const prevRows = prev ? await loadMetrics(prev) : [];

  const curCat  = groupByCategory(curRows);
  const prevCat = groupByCategory(prevRows);
  const prevMap = new Map(prevCat.map(c => [c.name, c]));

  function pct(delta:number, base:number){ return base <= 0 ? (delta>0 ? 1 : 0) : delta / base; }

  const merged = curCat.map(c => {
    const p = prevMap.get(c.name) || { foto:0, unlock:0, print:0 };
    const dFoto = c.foto - p.foto;
    const dUnlock = c.unlock - p.unlock;
    return {
      name: c.name,
      foto: c.foto,
      prevFoto: p.foto,
      deltaFotoPct: pct(dFoto, p.foto),
      unlock: c.unlock,
      prevUnlock: p.unlock,
      deltaUnlockPct: pct(dUnlock, p.unlock),
    };
  });

  const MIN_BASE = 50; // abaikan kategori yang sangat kecil supaya tidak misleading
  const risers = merged.filter(x => x.prevFoto >= MIN_BASE || x.foto >= MIN_BASE)
                       .sort((a,b)=> (b.deltaFotoPct||0) - (a.deltaFotoPct||0))
                       .slice(0,10);
  const decliners = merged.filter(x => x.prevFoto >= MIN_BASE || x.foto >= MIN_BASE)
                          .sort((a,b)=> (a.deltaFotoPct||0) - (b.deltaFotoPct||0))
                          .slice(0,10);

  return NextResponse.json({
    period,
    prevPeriod: prev || null,
    risers, decliners,
    categories: merged
  });
}
