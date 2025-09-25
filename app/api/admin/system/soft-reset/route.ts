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

  const metricsFile = path.join(dataDir, "metrics_outlets.json");
  const periodsDir  = path.join(dataDir, "periods");
  const dest        = path.join(backupsDir, "metrics-deleted-" + stamp());
  await mkdir(dest, { recursive: true });

  // move/copy+remove metrics_outlets.json
  if (await exists(metricsFile)) {
    try {
      await rename(metricsFile, path.join(dest, "metrics_outlets.json"));
    } catch {
      await cp(metricsFile, path.join(dest, "metrics_outlets.json"));
      await rm(metricsFile, { force: true });
    }
  }

  // move/copy+remove periods directory
  if (await exists(periodsDir)) {
    try {
      await rename(periodsDir, path.join(dest, "periods"));
    } catch {
      await cp(periodsDir, path.join(dest, "periods"), { recursive: true });
      await rm(periodsDir, { recursive: true, force: true });
    }
  }

  return NextResponse.json({ ok:true, backupPath: dest.replace(root,"").replace(/\\\\/g,"/") });
}
