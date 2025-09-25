import { NextResponse } from "next/server";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

async function exists(p: string){ try{ await stat(p); return true; } catch{ return false; } }

export async function GET(){
  const p = path.join(process.cwd(), "data", "users.json");
  let need = true;
  try{
    if (await exists(p)) {
      const arr = JSON.parse(await readFile(p, "utf8"));
      need = !(Array.isArray(arr) && arr.length > 0);
    } else {
      need = true;
    }
  }catch{ need = true; }
  return NextResponse.json({ needBootstrap: need });
}
