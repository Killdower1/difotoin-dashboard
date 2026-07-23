"use client";
import { useEffect, useMemo, useState } from "react";

type Row = { key: string; value: number };

export function useSettings() {
  const [map, setMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const rows = (await res.json()) as Row[];
        if (!alive) return;
        setMap(Object.fromEntries(rows.map(r => [r.key, r.value])));
      } catch (e) {
        console.error(e);
        if (alive) setError("Gagal load settings");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const S = useMemo(() => ({
    uptime_ratio_min:            map.uptime_ratio_min            ?? 65,
    keeper_foto_min:             map.CLASS_KEEPER_FOTO_MIN_A     ?? 1000,
    keeper_alt_foto_min:         map.CLASS_KEEPER_FOTO_MIN_B     ?? 600,
    keeper_alt_conversion_min:   map.CLASS_KEEPER_CONV_MIN_B     ?? 40,
    keeper_alt_active_ratio_min: map.keeper_alt_active_ratio_min ?? 80,
    optimize_foto_min:           map.CLASS_OPTIMIZE_FOTO_MIN     ?? 600,
    optimize_conversion_max:     map.CLASS_OPTIMIZE_CONV_MAX     ?? 30,
    relocate_foto_min:           map.CLASS_RELOCATE_FOTO_MIN     ?? 1,
    relocate_foto_max:           map.CLASS_RELOCATE_FOTO_MAX     ?? 200,
  }), [map]);

  return { S, loading, error };
}
