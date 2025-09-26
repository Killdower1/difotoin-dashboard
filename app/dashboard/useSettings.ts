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
    keeper_foto_min:             map.keeper_foto_min             ?? 1000,
    keeper_alt_foto_min:         map.keeper_alt_foto_min         ?? 600,
    keeper_alt_conversion_min:   map.keeper_alt_conversion_min   ?? 40,
    keeper_alt_active_ratio_min: map.keeper_alt_active_ratio_min ?? 80,
    optimize_foto_min:           map.optimize_foto_min           ?? 600,
    optimize_conversion_max:     map.optimize_conversion_max     ?? 30,
    relocate_foto_min:           map.relocate_foto_min           ?? 1,
    relocate_foto_max:           map.relocate_foto_max           ?? 200,
  }), [map]);

  return { S, loading, error };
}
