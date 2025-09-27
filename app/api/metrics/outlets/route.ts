import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { loadThresholds, classifyOutletSync } from "@/lib/classifier";

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
  _prev?: {
    foto: number; unlock: number; print: number; conv: number; class: string;
  };
  _delta?: {
    foto: number; unlock: number; print: number;
    conv: number; fotoPct: number|null;
    statusChange: "same"|"upgrade"|"downgrade";
    trendingUp: boolean; trendingDown: boolean;
  };
};

function num(v:any){ const n = Number(v ?? 0); return Number.isFinite(n) ? n : 0; }
async function exists(p:string){ try{ await stat(p); return true; }catch{ return false; } }

function resolvePath(period:string){
  const root = process.cwd();
  return period === "latest"
    ? path.join(root, "data", "metrics_outlets.json")
    : path.join(root, "data", "periods", period, "metrics_outlets.json");
}

async function load(period:string): Promise<Row[]> {
  const fp = resolvePath(period);
  if (!(await exists(fp))) return [];
  try {
    const txt = await readFile(fp, "utf8");
    const arr = JSON.parse(txt);
    return Array.isArray(arr) ? (arr as Row[]) : [];
  } catch {
    return [];
  }
}

function mergeRows(rows: Row[]): Row[] {
  const by = new Map<string, Row>();
  for (const r0 of rows) {
    const name = String(r0?.outlet || "").trim();
    if (!name) continue;
    const r: Row = {
      outlet: name,
      area: r0.area ?? "",
      venueType: r0.venueType ?? "",
      venueParent: r0.venueParent ?? r0.venueType ?? "",
      venueSubType: r0.venueSubType ?? "",
      indoorOutdoor: r0.indoorOutdoor ?? "",
      foto: num(r0.foto),
      unlock: num(r0.unlock),
      print: num(r0.print),
      activeRatio: num(r0.activeRatio),
      weekendShare: num(r0.weekendShare),
      eveningPeakShare: num(r0.eveningPeakShare),
      class: (r0.class || "").trim(),
      classReason: (r0 as any).classReason,
    };
    const cur = by.get(name);
    if (!cur) {
      by.set(name, r);
    } else {
      cur.foto = num(cur.foto) + num(r.foto);
      cur.unlock = num(cur.unlock) + num(r.unlock);
      cur.print = num(cur.print) + num(r.print);
      cur.area ||= r.area;
      cur.venueType ||= r.venueType;
      cur.venueParent ||= r.venueParent;
      cur.venueSubType ||= r.venueSubType;
      cur.indoorOutdoor ||= r.indoorOutdoor;
    }
  }
  return Array.from(by.values());
}

// konversi: utk classifier perlu %; utk UI perlu fraksi 0..1
const convPct = (row?: Row) => {
  const f = num(row?.foto), u = num(row?.unlock);
  return f > 0 ? (u / f) * 100 : 0;
};
const convFrac = (row?: Row) => {
  const f = num(row?.foto), u = num(row?.unlock);
  return f > 0 ? (u / f) : 0;
};

export async function GET(req: Request) {
  await loadThresholds();

  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "latest";
  const compare = url.searchParams.get("compare") || "";

  // 1) Muat & gabungkan data period aktif
  const rowsNow = mergeRows(await load(period));

  // 2) Klasifikasi setiap row (tanpa active ratio)
  for (const r of rowsNow) {
    const res = classifyOutletSync({
      foto: num(r.foto),
      unlock: num(r.unlock),
      conversion: convPct(r), // classifier pakai %
    });
    r.class = res.cls;
    r.classReason = res.reason;
  }

  // 3) Kalau compare diisi, attach _prev/_delta yang konsisten dgn UI
  if (compare) {
    const rowsPrev = mergeRows(await load(compare));
    const pmap = new Map<string, Row>();
    for (const p of rowsPrev) pmap.set(String(p.outlet || "").trim(), p);

    for (const r of rowsNow) {
      const p = pmap.get(String(r.outlet || "").trim()) || null;

      const fotoPrev   = num(p?.foto);
      const unlockPrev = num(p?.unlock);
      const printPrev  = num(p?.print);
      const convPrevFr = convFrac(p);
      const convNowFr  = convFrac(r);

      const prevRes = classifyOutletSync({
        foto: fotoPrev,
        unlock: unlockPrev,
        conversion: convPrevFr * 100, // classifier % 
      });
      const nowCls = r.class || classifyOutletSync({
        foto: num(r.foto),
        unlock: num(r.unlock),
        conversion: convNowFr * 100,
      }).cls;

      const dFoto = num(r.foto) - fotoPrev;
      const dUnlock = num(r.unlock) - unlockPrev;
      const dPrint = num(r.print) - printPrev;
      const dConv = convNowFr - convPrevFr; // 0..1 (UI pakai fraksi)
      const dFotoPct = fotoPrev > 0 ? dFoto / fotoPrev : null;

      const statusChange =
        nowCls === prevRes.cls ? "same"
        : ((prevRes.cls === "relocate-candidate" && nowCls !== "relocate-candidate") || (prevRes.cls !== "keeper" && nowCls === "keeper"))
          ? "upgrade" : "downgrade";

      (r as any)._prev = { foto: fotoPrev, unlock: unlockPrev, print: printPrev, conv: convPrevFr, class: prevRes.cls };
      (r as any)._delta = { foto: dFoto, unlock: dUnlock, print: dPrint, conv: dConv, fotoPct: dFotoPct, statusChange, trendingUp: dFoto > 0, trendingDown: dFoto < 0 };
    }
  }

  return Response.json(rowsNow, { status: 200 });
}
