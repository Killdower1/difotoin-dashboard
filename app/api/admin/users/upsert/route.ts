import { NextRequest } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest){
  const b = await req.json();
  const original = String(b.original || b.username || "").trim();
  const username = String(b.username || "").trim();
  const role = (b.role === "viewer") ? "viewer" : "admin";
  const password = String(b.password || "");
  if(!username) return Response.json({error:"username required"},{status:400});

  const dir = path.join(process.cwd(),"data");
  await mkdir(dir, { recursive:true });
  const p = path.join(dir, "users.json");

  let rows:any[] = [];
  try{ rows = JSON.parse(await readFile(p, "utf8")); }catch{}

  const ix = rows.findIndex(r => String(r.username).toLowerCase() === (original || username).toLowerCase());
  if(ix === -1 && rows.some(r => String(r.username).toLowerCase() === username.toLowerCase())){
    return Response.json({error:"duplicate username"},{status:400});
  }

  let passhash = undefined;
  if(password){ passhash = hashPassword(password); }
  const row = { username, role, passhash: passhash || (ix>=0 ? rows[ix].passhash : hashPassword(Math.random().toString(36).slice(2))) };

  if(ix>=0) rows[ix] = row; else rows.push(row);
  await writeFile(p, Buffer.from(JSON.stringify(rows,null,2)));
  return Response.json({ ok:true, username });
}
