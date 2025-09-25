import { NextRequest, NextResponse } from "next/server";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest){
  const { username, password } = await req.json().catch(()=>({}));
  if(!username || !password) return NextResponse.json({error:"missing creds"}, {status:400});

  const p = path.join(process.cwd(), "data", "users.json");
  let users: any[] = [];
  try{ users = JSON.parse(await readFile(p,"utf8")); }catch{}

  const u = users.find(x => String(x.username).toLowerCase() === String(username).toLowerCase());
  if(!u || !verifyPassword(password, String(u.passhash))) {
    return NextResponse.json({error:"invalid username/password"}, {status:401});
  }

  const exp = Math.floor(Date.now()/1000) + (60*60*8); // 8 jam
  const token = signToken({ sub: u.username, role: u.role || "admin", exp });

  const res = NextResponse.json({ ok:true, user:{ username: u.username, role: u.role||"admin" } });
  res.cookies.set("session", token, { httpOnly:true, sameSite:"lax", secure:false, path:"/" });
  return res;
}
