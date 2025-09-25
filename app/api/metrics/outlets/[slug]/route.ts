import { readFile } from "fs/promises";
import path from "node:path";

export async function GET(req: Request, ctx: { params: { slug: string } }) {
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "latest";
  const name = decodeURIComponent(ctx.params.slug);

  const root = process.cwd();
  async function loadJson(p:string){ try{ const b=await readFile(p,"utf8"); return JSON.parse(b);}catch{ return null; } }

  const masters: any[] = (await loadJson(path.join(root,"data","outlets_master.json"))) || [];
  const aliases: any[] = (await loadJson(path.join(root,"data","outlet_alias.json"))) || [];
  const locs: any[] = (await loadJson(path.join(root,"data","location_details.json"))) || [];

  const aliasMap = new Map<string,string>(); for(const a of aliases){ aliasMap.set(String(a.alias).trim(), String(a.master).trim()); }
  const canonical = aliasMap.get(name) || name;

  const metricsPath = period==="latest"
    ? path.join(root,"data","metrics_outlets.json")
    : path.join(root,"data","periods",period,"metrics_outlets.json");
  const dailyPath = period==="latest"
    ? null
    : path.join(root,"data","periods",period,"daily.json");

  const base = (await loadJson(metricsPath)) || [];
  const dailyAll = dailyPath ? await loadJson(dailyPath) : null;

  // kumpulkan nama master + alias
  const names = new Set<string>([canonical, name]);
  for (const [alias, master] of aliasMap.entries()) { if (master === canonical) names.add(alias); }

  const rows = base.filter((r:any)=> names.has(String(r.outlet||"").trim()));
  if (!rows.length) return Response.json({notFound:true}, { status: 404 });

  // merge hourProfile & counters
  const agg = { outlet: canonical, foto:0, unlock:0, print:0, activeRatio:0, weekendShare:0, eveningPeakShare:0, class:"monitor", hourProfile:Array(24).fill(0) as number[] };
  let w = 0;
  for (const r of rows) {
    const wt = r.foto || 1;
    agg.foto += r.foto||0; agg.unlock += r.unlock||0; agg.print += r.print||0;
    agg.activeRatio = (agg.activeRatio + (r.activeRatio||0))/2;
    agg.weekendShare = ((agg.weekendShare||0)*w + (r.weekendShare||0)*wt) / ((w+wt)||1);
    agg.eveningPeakShare = ((agg.eveningPeakShare||0)*w + (r.eveningPeakShare||0)*wt) / ((w+wt)||1);
    for(let i=0;i<24;i++){ agg.hourProfile[i] += (r.hourProfile?.[i]||0); }
    w += wt;
    agg.class = r.class || agg.class;
  }

  // daily series (kalau ada per period)
  let dailySeries: Array<{date:string,foto:number,unlock:number,print:number}> = [];
  if (dailyAll) {
    for (const n of names) {
      const arr = dailyAll[n];
      if (Array.isArray(arr)) {
        for (const d of arr) {
          const ex = dailySeries.find(x=>x.date===d.date);
          if (ex) { ex.foto += d.foto||0; ex.unlock += d.unlock||0; ex.print += d.print||0; }
          else dailySeries.push({ date: d.date, foto: d.foto||0, unlock: d.unlock||0, print: d.print||0 });
        }
      }
    }
    dailySeries.sort((a,b)=> a.date.localeCompare(b.date));
  }

  const m = masters.find(m=> String(m.name).trim() === canonical) || null;
  const loc = locs.find(l=> String(l.name).trim() === canonical) || null;

  return Response.json({ ...agg, area: m?.area, venueType: m?.venueType, indoorOutdoor: m?.indoorOutdoor, location: loc, dailySeries }, { status: 200 });
}
