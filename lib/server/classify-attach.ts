import { classifyByRules, loadThresholds } from "@/lib/classifier";

type Row = {
  outlet: string;
  area?: string;
  venueType?: string;
  venueParent?: string;
  venueSubType?: string;
  indoorOutdoor?: string;
  foto?: number;
  unlock?: number;
  print?: number;
  activeRatio?: number;      // diabaikan oleh classifier
  weekendShare?: number;
  eveningPeakShare?: number;
  class?: string;
  classReason?: string;
  _prev?: any;
  _delta?: any;
};

function toUiClass(c: "KEEPER"|"OPTIMIZE"|"RELOCATE"|"MONITOR"): "keeper"|"optimize-conversion"|"relocate-candidate"|"monitor" {
  if (c === "KEEPER") return "keeper";
  if (c === "OPTIMIZE") return "optimize-conversion";
  if (c === "RELOCATE") return "relocate-candidate";
  return "monitor";
}

export async function attachClassification(
  rows: Row[],
  prevRows?: Row[] | null
): Promise<Row[]> {
  const T = await loadThresholds();

  // Map prev by outlet (nama harus sama dengan rows)
  const prevMap = new Map<string, Row>();
  if (Array.isArray(prevRows)) {
    for (const p of prevRows) prevMap.set(String(p.outlet || ""), p);
  }

  const out: Row[] = [];
  for (const r of rows) {
    const foto   = Number(r.foto   ?? 0);
    const unlock = Number(r.unlock ?? 0);
    const print  = Number(r.print  ?? 0);
    const convPct = foto > 0 ? (unlock / foto) * 100 : 0;

    const cls = await classifyByRules({ foto, conversion: convPct });
    let reason = "";
    // bikin reason human-friendly dari threshold yg aktif
    if (foto >= T.KEEPER_FOTO_MIN_A) {
      reason = `Keeper: Foto ≥ ${T.KEEPER_FOTO_MIN_A}`;
    } else if (foto >= T.KEEPER_FOTO_MIN_B && convPct >= T.KEEPER_CONV_MIN_B) {
      reason = `Keeper: Foto ≥ ${T.KEEPER_FOTO_MIN_B} & Conv ≥ ${T.KEEPER_CONV_MIN_B}%`;
    } else if (foto >= T.OPTIMIZE_FOTO_MIN && convPct < T.OPTIMIZE_CONV_MAX) {
      reason = `Optimize: Foto ≥ ${T.OPTIMIZE_FOTO_MIN} & Conv < ${T.OPTIMIZE_CONV_MAX}%`;
    } else if (foto >= T.RELOCATE_FOTO_MIN && foto < T.RELOCATE_FOTO_MAX) {
      reason = `Relocate: ${T.RELOCATE_FOTO_MIN} ≤ Foto < ${T.RELOCATE_FOTO_MAX}`;
    } else {
      reason = `Monitor (default)`;
    }

    const curClass = toUiClass(cls);

    // compare (optional)
    let _prev: any = undefined;
    let _delta: any = undefined;
    if (prevMap.size) {
      const p = prevMap.get(String(r.outlet || ""));
      if (p) {
        const pfoto   = Number(p.foto   ?? 0);
        const punlock = Number(p.unlock ?? 0);
        const pprint  = Number(p.print  ?? 0);
        const pconv   = pfoto > 0 ? (punlock / pfoto) * 100 : 0;

        const pcls = await classifyByRules({ foto: pfoto, conversion: pconv });
        const prevClass = toUiClass(pcls);

        const dFoto   = foto - pfoto;
        const dUnlock = unlock - punlock;
        const dPrint  = print - pprint;
        const dConv   = ((convPct - pconv) / 100); // delta untuk UI % (0..1)
        const dFotoPct = pfoto > 0 ? (foto - pfoto) / pfoto : null;

        const statusChange = curClass === prevClass ? "same" : (
          (prevClass === "relocate-candidate" && curClass !== "relocate-candidate") || (prevClass !== "keeper" && curClass === "keeper")
            ? "upgrade" : "downgrade"
        );
        const trendingUp = (dFoto > 0);
        const trendingDown = (dFoto < 0);

        _prev = { foto: pfoto, unlock: punlock, print: pprint, activeRatio: r.activeRatio ?? 0, conv: pconv/100, class: prevClass };
        _delta = { foto: dFoto, fotoPct: dFotoPct, unlock: dUnlock, print: dPrint, activeRatio: 0, conv: dConv, statusChange, trendingUp, trendingDown };
      }
    }

    out.push({
      ...r,
      class: curClass,
      classReason: reason,
      _prev, _delta,
    });
  }
  return out;
}
