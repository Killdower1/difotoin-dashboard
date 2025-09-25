import { NextRequest } from "next/server";
import { readFile, writeFile } from "fs/promises";
import path from "node:path";

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  if (!name) return Response.json({error:"name required"},{status:400});
  const p = path.join(process.cwd(),"data","outlets_master.json");
  let rows:any[] = [];
  try { rows = JSON.parse(await readFile(p,"utf8")); } catch {}
  const before = rows.length;
  rows = rows.filter(r => String(r.name).trim() !== String(name).trim());
  await writeFile(p, Buffer.from(JSON.stringify(rows,null,2)));
  return Response.json({ok:true, removed: before - rows.length});
}
