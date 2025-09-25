import { NextRequest } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "node:path";

export async function POST(req: NextRequest) {
  const b = await req.json();
  const originalName = String(b.originalName || b.name || "").trim();
  const name = String(b.name || "").trim();
  if (!name) return Response.json({error:"name required"},{status:400});

  const row = {
    name,
    floor_or_zone: String(b.floor_or_zone||"").trim(),
    nearby_anchor: String(b.nearby_anchor||"").trim(),
    nearby_feature: String(b.nearby_feature||"").trim(),
    signage_available: String(b.signage_available||"").trim(),
    los_1to5: Number(b.los_1to5||0),
    power_1to5: Number(b.power_1to5||0),
    permit_1to5: Number(b.permit_1to5||0),
    notes: String(b.notes||"").trim(),
  };

  const dir = path.join(process.cwd(),"data");
  await mkdir(dir,{recursive:true});
  const p = path.join(dir,"location_details.json");

  let rows:any[] = [];
  try { rows = JSON.parse(await readFile(p,"utf8")); } catch {}

  const existsIdx = rows.findIndex(r => String(r.name).trim() === (originalName || name));
  // prevent duplicates
  if (existsIdx === -1 && rows.some(r => String(r.name).trim() === name)) {
    return Response.json({error:"duplicate name"}, {status:400});
  }

  if (existsIdx >= 0) rows[existsIdx] = row; else rows.push(row);
  await writeFile(p, Buffer.from(JSON.stringify(rows,null,2)));
  return Response.json({ok:true, name});
}
