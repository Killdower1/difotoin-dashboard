import { NextRequest, NextResponse } from "next/server";
import { mkdir, rename, rm, cp, stat } from "node:fs/promises";
import path from "node:path";
import { verifyToken } from "@/lib/auth";

async function exists(p: string){ try{ await stat(p); return true; } catch{ return false; } }
function z(n:number){ return String(n).padStart(2,"0"); }
function stamp(){
  const d = new Date();
  return d.getFullYear().toString() + z(d.getMonth()+1) + z(d.getDate()) + "-" + z(d.getHours()) + z(d.getMinutes()) + z(d.getSeconds());
}

export async function POST(req: NextRequest){
  const tok = req.cookies.get("session")?.value || "";
  const payload = tok ? verifyToken(tok) : null;
  if(!payload || payload.role !== "admin"){
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const root = process.cwd();
  const dataDir = path.join(root, "data");
  const backupsDir = path.join(root, "backups");
  await mkdir(backupsDir, { recursive: true });

  if(!(await exists(dataDir))){
    const resEmpty = NextResponse.json({ ok:true, note:"data/ not found, nothing to reset", redirect:"/login" });
    resEmpty.cookies.set("session","", { httpOnly:true, sameSite:"lax", secure:false, path:"/", maxAge:0 });
    return resEmpty;
  }

  const dest = path.join(backupsDir, "data-deleted-" + stamp());
  try {
    await rename(dataDir, dest);
  } catch (e) {
    // fallback copy+remove kalau rename gagal
    try {
      await cp(dataDir, dest, { recursive: true });
      await rm(dataDir, { recursive: true, force: true });
    } catch (err) {
      return NextResponse.json({ error: "reset failed", message: String(err) }, { status: 500 });
    }
  }

  const res = NextResponse.json({ ok:true, backupPath: dest.replace(root,"").replace(/\\\\/g,"/"), redirect:"/login" });
  res.cookies.set("session","", { httpOnly:true, sameSite:"lax", secure:false, path:"/", maxAge:0 });
  return res;
}
