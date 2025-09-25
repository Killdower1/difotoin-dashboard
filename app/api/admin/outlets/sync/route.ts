import { NextRequest } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "node:path";

export async function POST(req: NextRequest) {
  const { period = "latest" } = await req.json().catch(()=>({}));
  const root = process.cwd();

  async function loadJson(p:string){ try{ const b=await readFile(p,"utf8"); return JSON.parse(b);}catch{ return null; } }

  // source names: ambil dari metrics_outlets.json (period atau latest)
  let metrics:any[] | null = null;
  if (period === "latest") {
    metrics = await loadJson(path.join(root,"data","metrics_outlets.json"));
    if (!metrics) {
      // fallback ke period terakhir dari index
      const idx = await loadJson(path.join(root,"data","periods","index.json")) || [];
      const last = Array.isArray(idx) && idx.length ? idx[idx.length-1] : null;
      if (last) metrics = await loadJson(path.join(root,"data","periods",last,"metrics_outlets.json"));
    }
  } else {
    metrics = await loadJson(path.join(root,"data","periods",period,"metrics_outlets.json"));
  }
  if (!metrics) return Response.json({error:"no metrics for selected period"}, {status:400});

  // load masters + aliases
  const mastersPath = path.join(root,"data","outlets_master.json");
  const aliasesPath = path.join(root,"data","outlet_alias.json");
  let masters:any[] = await loadJson(mastersPath) || [];
  const aliases:any[] = await loadJson(aliasesPath) || [];
  const aliasMap = new Map<string,string>();
  for (const a of aliases) aliasMap.set(String(a.alias||"").trim(), String(a.master||"").trim());

  const toKey = (s:string) => s.trim().toLowerCase();
  const masterSet = new Set<string>(masters.map(m => toKey(String(m.name||""))));
  let added = 0;

  for (const r of metrics) {
    const raw = String(r.outlet || r.Outlet || "").trim();
    if (!raw) continue;
    const canon = aliasMap.get(raw) || raw;
    const key = toKey(canon);
    if (masterSet.has(key)) continue;
    masters.push({ name: canon, area: "", venueType: "", indoorOutdoor: "" });
    masterSet.add(key);
    added++;
  }

  await writeFile(mastersPath, Buffer.from(JSON.stringify(masters, null, 2)));
  return Response.json({ ok:true, period, added });
}
