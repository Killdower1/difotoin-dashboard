import { NextRequest } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest){
  const { username, password } = await req.json().catch(()=>({}));
  if(!username || !password) return Response.json({error:"username/password required"},{status:400});

  const dir = path.join(process.cwd(),"data");
  await mkdir(dir,{recursive:true});
  const p = path.join(dir,"users.json");

  let rows:any[] = [];
  try{ rows = JSON.parse(await readFile(p,"utf8")); }catch{}

  if(rows.length > 0){
    return Response.json({error:"users already exist"},{status:400});
  }

  rows.push({ username, role:"admin", passhash: hashPassword(password) });
  await writeFile(p, Buffer.from(JSON.stringify(rows,null,2)));
  return Response.json({ ok:true, username });
}
