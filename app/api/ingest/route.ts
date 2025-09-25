import { NextRequest } from "next/server";
import { writeFile, mkdir, readFile } from "fs/promises";
import path from "node:path";
import { parseSheetToEvents, detectPeriod, aggregateAll } from "@/lib/etl";

export async function POST(req: NextRequest) {
  const data = await req.formData();
  const file = data.get("file") as File | null;
  if (!file) return Response.json({ error: "no file" }, { status: 400 });

  const ab = await file.arrayBuffer();
  const events = parseSheetToEvents(ab);
  if (!events.length) return Response.json({ error: "empty/invalid file" }, { status: 400 });

  const period = (data.get("period") as string)?.trim() || detectPeriod(events); // YYYY-MM
  const setLatest = String(data.get("setLatest") ?? "") === "1";
  const { outlets, dailyByOutlet } = aggregateAll(events);

  const root = process.cwd();
  const dataDir = path.join(root, "data");
  await mkdir(dataDir, { recursive: true });

  // === AUTO-POPULATE OUTLET MASTER ===
  const mastersPath = path.join(dataDir, "outlets_master.json");
  const aliasesPath = path.join(dataDir, "outlet_alias.json");
  let masters: any[] = [];
  let aliases: any[] = [];
  try { masters = JSON.parse(await readFile(mastersPath, "utf8")); } catch {}
  try { aliases = JSON.parse(await readFile(aliasesPath, "utf8")); } catch {}
  const aliasMap = new Map<string,string>();
  for (const a of aliases) aliasMap.set(String(a.alias||"").trim(), String(a.master||"").trim());

  const toKey = (s:string) => s.trim().toLowerCase();
  const masterSet = new Set<string>(masters.map(m => toKey(String(m.name||""))));
  const seen = new Set<string>();

  for (const e of events) {
    const raw = String((e as any).Outlet || "").trim();
    if (!raw) continue;
    const canon = aliasMap.get(raw) || raw; // kalau ada alias, pakai master-nya
    const key = toKey(canon);
    if (masterSet.has(key) || seen.has(key)) continue;
    masters.push({ name: canon, area: "", venueType: "", indoorOutdoor: "" });
    masterSet.add(key);
    seen.add(key);
  }
  await writeFile(mastersPath, Buffer.from(JSON.stringify(masters, null, 2)));

  // === SIMPAN METRICS PER-PERIOD ===
  const perDir = path.join(root, "data", "periods", period);
  await mkdir(perDir, { recursive: true });
  await writeFile(path.join(perDir, "metrics_outlets.json"), Buffer.from(JSON.stringify(outlets, null, 2)));
  await writeFile(path.join(perDir, "daily.json"), Buffer.from(JSON.stringify(dailyByOutlet, null, 2)));

  // update index periods
  const idxPath = path.join(root, "data", "periods", "index.json");
  let periods: string[] = [];
  try { periods = JSON.parse(await readFile(idxPath, "utf8")); } catch {}
  if (!periods.includes(period)) periods.push(period);
  periods.sort();
  await writeFile(idxPath, Buffer.from(JSON.stringify(periods, null, 2)));

  // set snapshot latest kalau diminta
  if (setLatest) {
    await writeFile(path.join(dataDir, "metrics_outlets.json"), Buffer.from(JSON.stringify(outlets, null, 2)));
  }

  return Response.json({ ok: true, period, outlets: outlets.length, rows: events.length, masterAdded: seen.size });
}
