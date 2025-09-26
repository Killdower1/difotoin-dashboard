#!/usr/bin/env bash
set -euo pipefail
ROOT="${ROOT:-$(pwd)}"
cd "$ROOT"

# ===== 1) Tulis ulang hook useSettings =====
mkdir -p app/dashboard
cat > app/dashboard/useSettings.ts <<'TS'
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
TS
echo "✓ created app/dashboard/useSettings.ts"

# ===== 2) Deteksi file komponen dashboard =====
DC_PATH=""
if [[ -f app/dashboard/DashboardClient.tsx ]]; then
  DC_PATH=app/dashboard/DashboardClient.tsx
elif [[ -f app/dashboard/page.tsx ]] && grep -q '"use client"' app/dashboard/page.tsx; then
  DC_PATH=app/dashboard/page.tsx
else
  CAND="$(git ls-files | grep -Ei 'app/dashboard/.+(Client|page).*\.tsx' | head -n1 || true)"
  if [[ -n "${CAND:-}" ]]; then DC_PATH="$CAND"; fi
fi

if [[ -z "$DC_PATH" ]]; then
  echo "⚠ Ga nemu komponen client Dashboard."
  echo "  Jalankan ulang dengan:"
  echo "    DC_PATH=app/dashboard/page.tsx ./setup-thresholds.sh"
  exit 1
fi

echo "↪ Using DC_PATH=$DC_PATH"
export DC_PATH

# ===== 3) Patch file: tambah import + blok T =====
node - <<'NODE'
const fs = require('fs');
const dc = process.env.DC_PATH;
let code = fs.readFileSync(dc, 'utf8');

// (a) tambah import useSettings
if (!/import\s*\{\s*useSettings\s*\}\s*from\s*["']\.\/useSettings["']\s*;?/.test(code)) {
  let insertPos = 0;
  const mUse = code.match(/^\s*['"]use client['"];\s*\r?\n?/);
  if (mUse) insertPos = mUse[0].length;
  const after = code.slice(insertPos);
  const importRe = /^import[\s\S]*?;\s*\r?\n?/gm;
  let m, last = insertPos;
  while ((m = importRe.exec(after))) last = insertPos + m.index + m[0].length;
  const line = `import { useSettings } from "./useSettings";\n`;
  code = code.slice(0, last) + line + code.slice(last);
  console.log('✓ added import useSettings');
} else {
  console.log('• import useSettings already exists');
}

// (b) inject snippet T di dalam komponen
const hasSnippet = /useSettings\(\)/.test(code) && /RELOCATE_FOTO_MAX/.test(code);
if (!hasSnippet) {
  const sigs = [
    /export\s+default\s+function\s+DashboardClient\s*\([^)]*\)\s*\{/,
    /function\s+DashboardClient\s*\([^)]*\)\s*\{/,
    /const\s+DashboardClient\s*=\s*\([^)]*\)\s*=>\s*\{/,
    /export\s+default\s+function\s+Page\s*\([^)]*\)\s*\{/,
    /function\s+Page\s*\([^)]*\)\s*\{/,
    /const\s+Page\s*=\s*\([^)]*\)\s*=>\s*\{/
  ];
  let sig = null;
  for (const re of sigs) { const m = re.exec(code); if (m) { sig = m; break; } }
  if (!sig) {
    console.log('⚠ Tidak ketemu deklarasi function component. Tambahkan manual: const { S } = useSettings(); const T = {...}');
  } else {
    const idx = sig.index + sig[0].length;
    const snippet = `
  // === Thresholds from /api/settings ===
  const { S } = useSettings();
  const T = {
    UPTIME_MIN: S.uptime_ratio_min,
    KEEPER_FOTO_MIN: S.keeper_foto_min,
    KEEPER_ALT_FOTO_MIN: S.keeper_alt_foto_min,
    KEEPER_ALT_CONV_MIN: S.keeper_alt_conversion_min,
    KEEPER_ALT_ACTIVE_RATIO_MIN: S.keeper_alt_active_ratio_min,
    OPTIMIZE_FOTO_MIN: S.optimize_foto_min,
    OPTIMIZE_CONV_MAX: S.optimize_conversion_max,
    RELOCATE_FOTO_MIN: S.relocate_foto_min,
    RELOCATE_FOTO_MAX: S.relocate_foto_max,
  };
`;
    code = code.slice(0, idx) + snippet + code.slice(idx);
    console.log('✓ injected snippet T');
  }
} else {
  console.log('• snippet T already exists');
}

fs.writeFileSync(dc, code, 'utf8');
console.log('✓ patched', dc);
NODE

echo "Done. Buka /dashboard dan pakai 'T' di logic."
