export const THRESHOLDS = {
  ACTIVE_LOW: 0.65,

  KEEPER_MIN_FOTO: 1000,     // Keeper via volume
  KEEPER_MIX_FOTO: 600,      // Keeper via kombinasi
  KEEPER_MIX_CONV: 0.40,
  KEEPER_MIX_ACTIVE: 0.80,

  OPT_MIN_FOTO: 600,         // Optimize: traffic besar
  OPT_MAX_CONV: 0.30,        // ...konversi rendah

  RELOC_MIN_FOTO: 1,         // Relocate: 0 < foto < 200
  RELOC_MAX_FOTO_EXCLUSIVE: 200
};

export type Row = {
  outlet: string;
  foto?: number;
  unlock?: number;
  activeRatio?: number;
  eveningPeakShare?: number;
  weekendShare?: number;
};

export type ClassifyResult = { cls: string; reason: string };

function toNum(n:any){ const v = Number(n||0); return isFinite(v) ? v : 0; }

export function classifyOutlet(r: Row): ClassifyResult {
  const foto = toNum(r.foto);
  const unlock = toNum(r.unlock);
  const conv = foto>0 ? unlock/foto : 0;
  const ar = toNum(r.activeRatio);

  // 1) Uptime/ops rendah
  if (ar > 0 && ar < THRESHOLDS.ACTIVE_LOW) {
    return { cls: "check-uptime/ops", reason: "Active ratio rendah (<" + Math.round(THRESHOLDS.ACTIVE_LOW*100) + "%)" };
  }

  // 2) Keeper
  if (foto >= THRESHOLDS.KEEPER_MIN_FOTO ||
     (foto >= THRESHOLDS.KEEPER_MIX_FOTO && conv >= THRESHOLDS.KEEPER_MIX_CONV && ar >= THRESHOLDS.KEEPER_MIX_ACTIVE)) {
    return { cls: "keeper", reason: "Volume tinggi / konversi kuat & aktif" };
  }

  // 3) Optimize Conversion
  if (foto >= THRESHOLDS.OPT_MIN_FOTO && conv < THRESHOLDS.OPT_MAX_CONV) {
    return { cls: "optimize-conversion", reason: "Traffic besar, konversi rendah" };
  }

  // 4) Relocate candidate
  if (foto >= THRESHOLDS.RELOC_MIN_FOTO && foto < THRESHOLDS.RELOC_MAX_FOTO_EXCLUSIVE) {
    return { cls: "relocate-candidate", reason: "Volume sangat rendah" };
  }

  // 5) Monitor
  return { cls: "monitor", reason: "Performa tengah; butuh pemantauan" };
}
