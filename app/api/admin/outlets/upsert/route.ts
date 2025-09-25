import { NextRequest } from "next/server";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "node:path";
import { childToParentId } from "@/lib/venueTypes";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const originalName = String(body.originalName || body.name || "").trim();
  const name = String(body.name || "").trim();
  if (!name) return Response.json({error:"name required"},{status:400});

  const area = (body.area ?? "").toString().trim();
  // v2 fields:
  let venueParent = (body.venueParent ?? "").toString().trim().toLowerCase();
  const venueSubType = (body.venueSubType ?? "").toString().trim().toLowerCase();
  // backward compat: kalau client kirim venueType lama, anggap itu parent;
  // kalau ternyata yang dikirim adalah child id, derive parent dari child
  if (!venueParent) {
    const vOld = (body.venueType ?? "").toString().trim().toLowerCase();
    if (vOld) {
      const p = childToParentId(vOld);
      venueParent = p || vOld;
    }
  }

  const indoorOutdoor = (body.indoorOutdoor ?? "").toString().trim();

  const dir = path.join(process.cwd(),"data");
  await mkdir(dir,{recursive:true});
  const p = path.join(dir,"outlets_master.json");

  let rows:any[] = [];
  try { rows = JSON.parse(await readFile(p,"utf8")); } catch {}

  const keyEq = (s:string) => s.toString().trim().toLowerCase();
  const existsIdx = rows.findIndex(r => keyEq(r.name) === keyEq(originalName || name));
  if (existsIdx === -1 && rows.some(r => keyEq(r.name) === keyEq(name))) {
    return Response.json({error:"duplicate name"}, {status:400});
  }

  const row = {
    name,
    area,
    // simpan parent di dua field untuk kompatibilitas:
    venueType: venueParent,      // <- dipakai dashboard lama
    venueParent: venueParent,    // <- skema baru
    venueSubType: venueSubType,  // <- child opsional
    indoorOutdoor,
  };

  if (existsIdx >= 0) rows[existsIdx] = { ...rows[existsIdx], ...row };
  else rows.push(row);

  await writeFile(p, Buffer.from(JSON.stringify(rows,null,2)));
  return Response.json({ok:true, name});
}
