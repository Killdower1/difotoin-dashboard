"use client";

import { useEffect, useState } from "react";

type T = {
  CLASS_KEEPER_FOTO_MIN_A: number;
  CLASS_KEEPER_FOTO_MIN_B: number;
  CLASS_KEEPER_CONV_MIN_B: number;
  CLASS_OPTIMIZE_FOTO_MIN: number;
  CLASS_OPTIMIZE_CONV_MAX: number;
  CLASS_RELOCATE_FOTO_MIN: number;
  CLASS_RELOCATE_FOTO_MAX: number;
};

const FIELDS: { key: keyof T; label: string; hint?: string }[] = [
  { key: "CLASS_KEEPER_FOTO_MIN_A", label: "Keeper · Foto Min A" },
  { key: "CLASS_KEEPER_FOTO_MIN_B", label: "Keeper · Foto Min B" },
  { key: "CLASS_KEEPER_CONV_MIN_B", label: "Keeper · Conv Min B (%)", hint: "dalam persen, mis. 2.5" },
  { key: "CLASS_OPTIMIZE_FOTO_MIN", label: "Optimize · Foto Min" },
  { key: "CLASS_OPTIMIZE_CONV_MAX", label: "Optimize · Conv Max (%)", hint: "dalam persen, mis. 1.5" },
  { key: "CLASS_RELOCATE_FOTO_MIN", label: "Relocate · Foto Min" },
  { key: "CLASS_RELOCATE_FOTO_MAX", label: "Relocate · Foto Max (exclusive)" },
];

export default function AdminClassifierPage() {
  const [data, setData] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // load thresholds
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/classifier-thresholds", { cache: "no-store" });
        const j = await r.json();
        if (!alive) return;
        setData(j?.data as T);
      } catch {
        if (!alive) return;
        setErr("Gagal memuat data.");
      }
    })();
    return () => { alive = false; };
  }, []);

  function onChangeField(k: keyof T, raw: string) {
    if (!data) return;
    // hanya angka & titik (desimal)
    const cleaned = raw.replace(/[^0-9.]/g, "");
    const val = cleaned === "" ? ("" as any) : Number(cleaned);
    setData({ ...data, [k]: isNaN(val) ? 0 : (val as number) });
  }

  async function onSave() {
    if (!data) return;
    setSaving(true); setErr(null);
    try {
      const r = await fetch("/api/classifier-thresholds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      setSavedAt(Date.now());
    } catch (e:any) {
      setErr(String(e?.message || "Gagal menyimpan."));
    } finally {
      setSaving(false);
    }
  }

  if (!data) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Ambang Klasifikasi (Tanpa Active Ratio)</h1>
      <p className="text-sm text-muted-foreground">
        Nilai disimpan ke <code>Setting</code> dan dipakai langsung oleh <code>lib/classifier.ts</code>.
        Perubahan di sini mempengaruhi dashboard (bulanan) tanpa perlu deploy ulang.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {FIELDS.map(f => (
          <label key={f.key} className="space-y-1">
            <div className="text-sm font-medium">{f.label}</div>
            <input
              type="text" inputMode="decimal" pattern="[0-9.]*"
              value={(data as any)[f.key] ?? ""}
              onChange={e => onChangeField(f.key, e.target.value)}
              onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
              className="w-full border rounded-md px-3 py-2 text-sm"
              placeholder={f.hint || ""}
            />
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-60"
        >
          {saving ? "Menyimpan…" : "Simpan"}
        </button>
        {savedAt && <span className="text-xs text-green-600">Tersimpan</span>}
        {err && <span className="text-xs text-red-600">{err}</span>}
      </div>

      <div className="text-xs text-muted-foreground">
        Rumus: <code>conversion = unlock / foto × 100%</code>
      </div>
    </div>
  );
}
