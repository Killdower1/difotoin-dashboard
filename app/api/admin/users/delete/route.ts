import { NextRequest } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function POST(req: NextRequest){
  const { username } = await req.json();
  if(!username) return Response.json({error:"username required"},{status:400});
  const p = path.join(process.cwd(),"data","users.json");
  let rows:any[] = [];
  try{ rows = JSON.parse(await readFile(p,"utf8")); }catch{}
  const before = rows.length;
  rows = rows.filter(r => String(r.username).toLowerCase() !== String(username).toLowerCase());
  await writeFile(p, Buffer.from(JSON.stringify(rows,null,2)));
  return Response.json({ ok:true, removed: before - rows.length });
}
