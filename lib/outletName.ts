import { readFile } from "node:fs/promises";
import path from "node:path";

export function normalizeName(raw: string | null | undefined): string {
  if (!raw) return "";
  let s = String(raw).trim();

  // Unicode normalize + hapus diakritik
  try { s = s.normalize("NFKD"); } catch {}
  s = s.replace(/[\u0300-\u036f]/g, "");

  // Samakan beberapa karakter umum
  s = s.replace(/[×✕✖✗✘]/g, "x");      // simbol multiply jadi 'x'
  s = s.replace(/[–—−‐\-]+/g, " ");     // semua dash/minus jadi spasi
  s = s.replace(/[_/\\]+/g, " ");       // underscore & slash jadi spasi
  s = s.replace(/[“”„‟"']/g, "");       // quote hilangkan
  s = s.replace(/[^0-9a-zA-Z&()]+/g, " "); // sisakan huruf/angka/&/()

  // Ejaan umum: " x " kadang maksudnya kolaborasi; biarkan 'x' sebagai token
  // "&" -> "dan" agar setara dengan penulisan 'dan'
  s = s.replace(/\s*&\s*/g, " dan ");

  // rapikan spasi & lowercase
  s = s.replace(/\s+/g, " ").trim().toLowerCase();
  return s;
}

export type AliasRow = { alias: string; master: string };
export type MasterRow = { name: string; area?: string; venueParent?: string; venueSubType?: string; indoorOutdoor?: string };

export async function loadAliasAndMaster() {
  const root = process.cwd();
  const aliasPath = path.join(root, "data", "outlet_alias.json");
  const masterPath = path.join(root, "data", "outlets_master.json");

  let aliases: AliasRow[] = [];
  let masters: MasterRow[] = [];

  try { aliases = JSON.parse(await readFile(aliasPath, "utf8")); } catch {}
  try { masters = JSON.parse(await readFile(masterPath, "utf8")); } catch {}

  // map normalisasi
  const masterByNorm = new Map<string, MasterRow>();
  for (const m of masters) {
    const key = normalizeName(m?.name);
    if (key) masterByNorm.set(key, m);
  }

  const aliasToMasterName = new Map<string, string>();
  for (const a of aliases) {
    const key = normalizeName(a?.alias);
    const val = String(a?.master || "").trim();
    if (key && val) aliasToMasterName.set(key, val);
  }

  return { aliases, masters, masterByNorm, aliasToMasterName };
}

export function resolveNameToMaster(
  rawName: string,
  masterByNorm: Map<string, MasterRow>,
  aliasToMasterName: Map<string, string>
){
  const n = normalizeName(rawName);
  // 1) alias -> master (string master name)
  const aliasHit = aliasToMasterName.get(n);
  if (aliasHit) {
    const m = masterByNorm.get(normalizeName(aliasHit));
    if (m) return m.name;
    return aliasHit; // fallback: pakai string master dari alias
  }
  // 2) cocok langsung ke master (normalized equality)
  const m2 = masterByNorm.get(n);
  if (m2) return m2.name;

  // 3) fallback: pakai nama asli (trim)
  return String(rawName).trim();
}
