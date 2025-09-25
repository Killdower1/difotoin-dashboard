import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { classifyOutlet } from "@/lib/classifier";

type Row = {
  outlet: string;
  area?: string;
  venueType?: string;
  venueParent?: string;
  venueSubType?: string;
  indoorOutdoor?: string;
  foto?: number;
  unlock?: number;
  print?: number;
  activeRatio?: number;
  weekendShare?: number;
  eveningPeakShare?: number;
  class?: string;
  classReason?: string;
};

function toNum(n:any){ const v = Number(n||0); return Number.isFinite(v) ? v : 0; }
async function exists(p:string){ try{ await stat(p); return true; }catch{ return false; } }
function z(n:number){ return String(n).padStart(2,"0"); }

function resolvePath(period:string){
  const root = process.cwd();
  if (period === "latest") return path.join(root, "data", "metrics_outlets.json");
  return path.join(root, "data", "periods", period, "metrics_outlets.json");
}

async function load(period:string): Promise<Row[]>{
  const p = resolvePath(period);
  if (!(await exists(p))) return [];
  try{
    const txt = await readFile(p, "utf8");
    const arr = JSON.parse(txt);
    return Array.isArray(arr) ? arr as Row[] : [];
  }catch{
    return [];
  }
}

function mergeRows(rows: Row[]): Row[] {
  const by = new Map<string, Row>();
  for (const r0 of rows){
    const name = String(r0?.outlet||"").trim();
    if (!name) continue;

    const r = {
      outlet: name,
      area: r0.area ?? "",
      venueType: r0.venueType ?? "",
      venueParent: r0.venueParent ?? r0.venueType ?? "",
      venueSubType: r0.venueSubType ?? "",
      indoorOutdoor: r0.indoorOutdoor ?? "",
      foto: toNum(r0.foto),
      unlock: toNum(r0.unlock),
      print: toNum(r0.print),
      activeRatio: toNum(r0.activeRatio),
      weekendShare: toNum(r0.weekendShare),
      eveningPeakShare: toNum(r0.eveningPeakShare),
      class: (r0.class||"").trim(),
      classReason: (r0 as any).classReason,
    } as Row;

    const cur = by.get(name);
    if (!cur){
      by.set(name, r);
    } else {
      cur.foto = toNum(cur.foto) + toNum(r.foto);
      cur.unlock = toNum(cur.unlock) + toNum(r.unlock);
      cur.print = toNum(cur.print) + toNum(r.print);
      cur.area ||= r.area;
      cur.venueType ||= r.venueType;
      cur.venueParent ||= r.venueParent;
      cur.venueSubType ||= r.venueSubType;
      cur.indoorOutdoor ||= r.indoorOutdoor;
    }
  }
  return Array.from(by.values());
}

function conv(row?: Row){
  const f = toNum(row?.foto);
  const u = toNum(row?.unlock);
  return f>0 ? u/f : 0;
}

export async function GET(req: Request){
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "latest";
  const compare = url.searchParams.get("compare") || "";

  // load current
  const rows = await load(period);
  const out = mergeRows(rows);

  // auto-classify jika class kosong/monitor
  for (const r of out){
    const current = String(r.class||"").trim() || "monitor";
    if (current === "monitor"){
      const res = classifyOutlet({
        outlet: r.outlet,
        foto: r.foto,
        unlock: r.unlock,
        activeRatio: r.activeRatio,
        eveningPeakShare: r.eveningPeakShare,
        weekendShare: r.weekendShare,
      });
      r.class = res.cls;
      r.classReason = res.reason;
    }
  }

  if (!compare){
    return Response.json(out, { status: 200 });
  }

  // load previous & join
  const prevRows = mergeRows(await load(compare));
  const prevMap = new Map(prevRows.map(r => [String(r.outlet).trim(), r]));

  const enriched = out.map(r => {
    const p = prevMap.get(r.outlet);
    const fotoPrev = toNum(p?.foto);
    const unlockPrev = toNum(p?.unlock);
    const printPrev = toNum(p?.print);
    const arPrev = toNum(p?.activeRatio);
    const convPrev = conv(p);
    const convNow = conv(r);

    const prevClass = (p?.class && String(p.class).trim()) || classifyOutlet({
      outlet: p?.outlet || r.outlet,
      foto: p?.foto,
      unlock: p?.unlock,
      activeRatio: p?.activeRatio,
      eveningPeakShare: p?.eveningPeakShare,
      weekendShare: p?.weekendShare,
    }).cls;

    const statusChange =
      r.class === prevClass ? "same" :
      (r.class === "keeper" || (prevClass === "relocate-candidate" && r.class !== prevClass)) ? "upgrade" :
      "downgrade";

    const dFoto = toNum(r.foto) - fotoPrev;
    const dUnlock = toNum(r.unlock) - unlockPrev;
    const dPrint = toNum(r.print) - printPrev;
    const dActive = toNum(r.activeRatio) - arPrev;
    const dConv = convNow - convPrev;

    const dFotoPct = fotoPrev>0 ? dFoto / fotoPrev : null;
    const trendingUp = dFotoPct!=null && dFotoPct >= 0.25 && fotoPrev >= 200;
    const trendingDown = dFotoPct!=null && dFotoPct <= -0.25 && fotoPrev >= 200;

    return {
      ...r,
      _prev: {
        foto: fotoPrev, unlock: unlockPrev, print: printPrev,
        activeRatio: arPrev, conv: convPrev, class: prevClass
      },
      _delta: {
        foto: dFoto, fotoPct: dFotoPct,
        unlock: dUnlock, print: dPrint,
        activeRatio: dActive, conv: dConv,
        statusChange, trendingUp, trendingDown
      }
    };
  });

  return Response.json(enriched, { status: 200 });
}
