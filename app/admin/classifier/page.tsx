"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type T = {
  CLASS_KEEPER_FOTO_MIN_A: number;
  CLASS_KEEPER_FOTO_MIN_B: number;
  CLASS_KEEPER_CONV_MIN_B: number;
  CLASS_OPTIMIZE_FOTO_MIN: number;
  CLASS_OPTIMIZE_CONV_MAX: number;
  CLASS_RELOCATE_FOTO_MIN: number;
  CLASS_RELOCATE_FOTO_MAX: number;
};

const LABELS: Record<keyof T, string> = {
  CLASS_KEEPER_FOTO_MIN_A: "Keeper — Foto minimum (jalur A)",
  CLASS_KEEPER_FOTO_MIN_B: "Keeper — Foto minimum (jalur B)",
  CLASS_KEEPER_CONV_MIN_B: "Keeper — Conversion minimum % (jalur B)",
  CLASS_OPTIMIZE_FOTO_MIN: "Optimize — Foto minimum",
  CLASS_OPTIMIZE_CONV_MAX: "Optimize — Conversion maksimum %",
  CLASS_RELOCATE_FOTO_MIN: "Relocate — Foto minimum",
  CLASS_RELOCATE_FOTO_MAX: "Relocate — Foto maksimum (exclusive)",
};

export default function ClassifierSettingsPage() {
  const [data, setData] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/classifier-thresholds", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d.data as T));
  }, []);

  function setVal<K extends keyof T>(k: K, v: number) {
    if (!data) return;
    setData({ ...data, [k]: v });
  }

  async function save() {
    if (!data) return;
    setSaving(true);
    const res = await fetch("/api/classifier-thresholds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) {
      // optionally show toast
    }
  }

  if (!data) return <div className="p-4">Loading…</div>;

  return (
    <div className="p-4 max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Ambang Klasifikasi (Tanpa Active Ratio)</h1>
      <p className="text-sm text-muted-foreground">
        Nilai disimpan di <code>Setting</code> dan dipakai langsung oleh <code>lib/classifier.ts</code>.
      </p>

      <Card>
        <CardHeader><CardTitle>Keeper</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">{LABELS.CLASS_KEEPER_FOTO_MIN_A}</label>
            <Input type="number" value={data.CLASS_KEEPER_FOTO_MIN_A}
              onChange={(e) => setVal("CLASS_KEEPER_FOTO_MIN_A", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm">{LABELS.CLASS_KEEPER_FOTO_MIN_B}</label>
            <Input type="number" value={data.CLASS_KEEPER_FOTO_MIN_B}
              onChange={(e) => setVal("CLASS_KEEPER_FOTO_MIN_B", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm">{LABELS.CLASS_KEEPER_CONV_MIN_B}</label>
            <Input type="number" value={data.CLASS_KEEPER_CONV_MIN_B}
              onChange={(e) => setVal("CLASS_KEEPER_CONV_MIN_B", Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Optimize Conversion</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">{LABELS.CLASS_OPTIMIZE_FOTO_MIN}</label>
            <Input type="number" value={data.CLASS_OPTIMIZE_FOTO_MIN}
              onChange={(e) => setVal("CLASS_OPTIMIZE_FOTO_MIN", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm">{LABELS.CLASS_OPTIMIZE_CONV_MAX}</label>
            <Input type="number" value={data.CLASS_OPTIMIZE_CONV_MAX}
              onChange={(e) => setVal("CLASS_OPTIMIZE_CONV_MAX", Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Relocate</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm">{LABELS.CLASS_RELOCATE_FOTO_MIN}</label>
            <Input type="number" value={data.CLASS_RELOCATE_FOTO_MIN}
              onChange={(e) => setVal("CLASS_RELOCATE_FOTO_MIN", Number(e.target.value))} />
          </div>
          <div>
            <label className="text-sm">{LABELS.CLASS_RELOCATE_FOTO_MAX}</label>
            <Input type="number" value={data.CLASS_RELOCATE_FOTO_MAX}
              onChange={(e) => setVal("CLASS_RELOCATE_FOTO_MAX", Number(e.target.value))} />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
      </div>
    </div>
  );
}
