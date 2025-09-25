import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "node:path";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "latest";
  const root = process.cwd();
  async function loadJson(p:string){ try{ const b=await readFile(p,"utf8"); return JSON.parse(b);}catch{ return null; } }
  const dataPath = period==="latest" ? path.join(root,"data","metrics_outlets.json") : path.join(root,"data","periods",period,"metrics_outlets.json");
  const rows:any[] = (await loadJson(dataPath)) || [];

  const header = ["outlet","area","venueType","indoorOutdoor","foto","unlock","print","conversion","activeRatio","weekendShare","eveningPeakShare","class"];
  const csv = [header.join(",")].concat(
    rows.map(r=>{
      const conv = r.foto ? (r.unlock/r.foto) : 0;
      return [r.outlet,r.area||"",r.venueType||"",r.indoorOutdoor||"",r.foto||0,r.unlock||0,r.print||0,conv.toFixed(4),(r.activeRatio||0).toFixed(4),(r.weekendShare||0).toFixed(4),(r.eveningPeakShare||0).toFixed(4),r.class||""]
        .map(x=>String(x).replace(/"/g,'""'))
        .map(x=>/[,\"\n]/.test(x)?`"${x}"`:x)
        .join(",");
    })
  ).join("\n");

  return new Response(csv, { headers: { "content-type":"text/csv; charset=utf-8", "content-disposition": `attachment; filename="outlets_${period}.csv"` } });
}
