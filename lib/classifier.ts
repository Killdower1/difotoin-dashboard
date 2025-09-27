/* lib/classifier.ts — Single Source of Truth (tanpa active ratio) */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export type Thresholds = {
  KEEPER_FOTO_MIN_A: number;
  KEEPER_FOTO_MIN_B: number;
  KEEPER_CONV_MIN_B: number;
  OPTIMIZE_FOTO_MIN: number;
  OPTIMIZE_CONV_MAX: number;
  RELOCATE_FOTO_MIN: number;
  RELOCATE_FOTO_MAX: number; // exclusive
};

const DEFAULTS: Thresholds = {
  KEEPER_FOTO_MIN_A: 1000,
  KEEPER_FOTO_MIN_B: 600,
  KEEPER_CONV_MIN_B: 40,
  OPTIMIZE_FOTO_MIN: 600,
  OPTIMIZE_CONV_MAX: 30,
  RELOCATE_FOTO_MIN: 1,
  RELOCATE_FOTO_MAX: 200,
};

const KEYS = [
  "CLASS_KEEPER_FOTO_MIN_A",
  "CLASS_KEEPER_FOTO_MIN_B",
  "CLASS_KEEPER_CONV_MIN_B",
  "CLASS_OPTIMIZE_FOTO_MIN",
  "CLASS_OPTIMIZE_CONV_MAX",
  "CLASS_RELOCATE_FOTO_MIN",
  "CLASS_RELOCATE_FOTO_MAX",
] as const;

let cache: { at: number; T: Thresholds } | null = null;
let LAST_T: Thresholds = DEFAULTS;

export async function loadThresholds(): Promise<Thresholds> {
  const now = Date.now();
  if (cache && now - cache.at < 30_000) return cache.T;

  const rows = await prisma.setting.findMany({
    where: { key: { in: KEYS as unknown as string[] } },
    select: { key: true, value: true },
  });

  const map: Record<string, number> = {};
  for (const r of rows) {
    const n = Number(r.value);
    if (!Number.isNaN(n)) map[r.key] = n;
  }

  const T: Thresholds = {
    KEEPER_FOTO_MIN_A: map.CLASS_KEEPER_FOTO_MIN_A ?? DEFAULTS.KEEPER_FOTO_MIN_A,
    KEEPER_FOTO_MIN_B: map.CLASS_KEEPER_FOTO_MIN_B ?? DEFAULTS.KEEPER_FOTO_MIN_B,
    KEEPER_CONV_MIN_B: map.CLASS_KEEPER_CONV_MIN_B ?? DEFAULTS.KEEPER_CONV_MIN_B,
    OPTIMIZE_FOTO_MIN: map.CLASS_OPTIMIZE_FOTO_MIN ?? DEFAULTS.OPTIMIZE_FOTO_MIN,
    OPTIMIZE_CONV_MAX: map.CLASS_OPTIMIZE_CONV_MAX ?? DEFAULTS.OPTIMIZE_CONV_MAX,
    RELOCATE_FOTO_MIN: map.CLASS_RELOCATE_FOTO_MIN ?? DEFAULTS.RELOCATE_FOTO_MIN,
    RELOCATE_FOTO_MAX: map.CLASS_RELOCATE_FOTO_MAX ?? DEFAULTS.RELOCATE_FOTO_MAX,
  };

  cache = { at: now, T }; LAST_T = T;
  return T;
}

export type ClassifyResult = "KEEPER" | "OPTIMIZE" | "RELOCATE" | "MONITOR";

export async function classifyByRules(input: {
  foto: number;
  conversion: number; // %
}): Promise<ClassifyResult> {
  const T = await loadThresholds();
  const { foto, conversion } = input;

  if (foto >= T.KEEPER_FOTO_MIN_A) return "KEEPER";
  if (foto >= T.KEEPER_FOTO_MIN_B && conversion >= T.KEEPER_CONV_MIN_B) return "KEEPER";
  if (foto >= T.OPTIMIZE_FOTO_MIN && conversion < T.OPTIMIZE_CONV_MAX) return "OPTIMIZE";
  if (foto >= T.RELOCATE_FOTO_MIN && foto < T.RELOCATE_FOTO_MAX) return "RELOCATE";
  return "MONITOR";
}

function toUiClass(c: ClassifyResult): "keeper"|"optimize-conversion"|"relocate-candidate"|"monitor" {
  if (c === "KEEPER") return "keeper";
  if (c === "OPTIMIZE") return "optimize-conversion";
  if (c === "RELOCATE") return "relocate-candidate";
  return "monitor";
}

/** Back-compat: dipanggil route lama yang expect {cls, reason} */
export async function classifyOutlet(args: {
  outlet?: string;
  foto?: number;
  unlock?: number;
  conversion?: number;      // jika kosong, dihitung dari unlock/foto
}): Promise<{ cls: "keeper"|"optimize-conversion"|"relocate-candidate"|"monitor"; reason: string; }> {
  const foto = Number(args?.foto ?? 0);
  const unlock = Number(args?.unlock ?? 0);
  const conversion = args?.conversion != null ? Number(args.conversion) : (foto > 0 ? (unlock / foto) * 100 : 0);

  const T = await loadThresholds();
  const clsRule = await classifyByRules({ foto, conversion });
  const cls = toUiClass(clsRule);

  let reason = "Monitor (default)";
  if (clsRule === "KEEPER") {
    if (foto >= T.KEEPER_FOTO_MIN_A) reason = `Keeper: Foto ≥ ${T.KEEPER_FOTO_MIN_A}`;
    else reason = `Keeper: Foto ≥ ${T.KEEPER_FOTO_MIN_B} & Conv ≥ ${T.KEEPER_CONV_MIN_B}%`;
  } else if (clsRule === "OPTIMIZE") {
    reason = `Optimize: Foto ≥ ${T.OPTIMIZE_FOTO_MIN} & Conv < ${T.OPTIMIZE_CONV_MAX}%`;
  } else if (clsRule === "RELOCATE") {
    reason = `Relocate: ${T.RELOCATE_FOTO_MIN} ≤ Foto < ${T.RELOCATE_FOTO_MAX}`;
  }
  return { cls, reason };
}
// Back-compat: kalau ada import { classifyOutlet } sudah tersedia; kalau ada import { classifyByRules } juga tersedia.

/* ===== Sinkron variants (untuk pemakaian di callback non-async) ===== */
export function classifyByRulesSync(input: { foto: number; conversion: number }, t?: Thresholds): ClassifyResult {
  const T = t ?? (typeof LAST_T !== "undefined" ? LAST_T : DEFAULTS);
  const { foto, conversion } = input;
  if (foto >= T.KEEPER_FOTO_MIN_A) return "KEEPER";
  if (foto >= T.KEEPER_FOTO_MIN_B && conversion >= T.KEEPER_CONV_MIN_B) return "KEEPER";
  if (foto >= T.OPTIMIZE_FOTO_MIN && conversion < T.OPTIMIZE_CONV_MAX) return "OPTIMIZE";
  if (foto >= T.RELOCATE_FOTO_MIN && foto < T.RELOCATE_FOTO_MAX) return "RELOCATE";
  return "MONITOR";
}

export function classifyOutletSync(args: { outlet?: string; foto?: number; unlock?: number; conversion?: number }, t?: Thresholds):
  { cls: "keeper"|"optimize-conversion"|"relocate-candidate"|"monitor"; reason: string } {
  const foto = Number(args?.foto ?? 0);
  const unlock = Number(args?.unlock ?? 0);
  const conv = args?.conversion != null ? Number(args.conversion) : (foto > 0 ? (unlock / foto) * 100 : 0);

  const clsRule = classifyByRulesSync({ foto, conversion: conv }, t);
  const cls = clsRule === "KEEPER" ? "keeper"
            : clsRule === "OPTIMIZE" ? "optimize-conversion"
            : clsRule === "RELOCATE" ? "relocate-candidate"
            : "monitor";

  const T = (typeof LAST_T !== "undefined" ? LAST_T : DEFAULTS);
  let reason = "Monitor (default)";
  if (clsRule === "KEEPER") {
    reason = (foto >= T.KEEPER_FOTO_MIN_A)
      ? `Keeper: Foto ≥ ${T.KEEPER_FOTO_MIN_A}`
      : `Keeper: Foto ≥ ${T.KEEPER_FOTO_MIN_B} & Conv ≥ ${T.KEEPER_CONV_MIN_B}%`;
  } else if (clsRule === "OPTIMIZE") {
    reason = `Optimize: Foto ≥ ${T.OPTIMIZE_FOTO_MIN} & Conv < ${T.OPTIMIZE_CONV_MAX}%`;
  } else if (clsRule === "RELOCATE") {
    reason = `Relocate: ${T.RELOCATE_FOTO_MIN} ≤ Foto < ${T.RELOCATE_FOTO_MAX}`;
  }
  return { cls, reason };
}
