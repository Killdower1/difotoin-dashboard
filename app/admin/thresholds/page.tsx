"use client";
import { useEffect, useMemo, useState } from "react";

type Row = { key: string; value: number };

export default function ThresholdSettingsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as Row[];
      setRows(json);
    } catch (e) {
      console.error(e);
      setErr("Gagal load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const updateLocal = (k: string, v: number) => {
    setRows((prev) => prev.map((r) => (r.key === k ? { ...r, value: v } : r)));
  };

  const saveOne = async (k: string) => {
    const r = rows.find((x) => x.key === k);
    if (!r) return;
    setSaving(k); setErr(null);
    try {
      const res = await fetch(`/api/settings/${encodeURIComponent(k)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: r.value }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (e) {
      console.error(e);
      setErr(`Gagal simpan: ${k}`);
    } finally {
      setSaving(null);
    }
  };

  // tambah baris baru
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState<number>(0);
  const canAdd = useMemo(() => newKey.trim().length > 0, [newKey]);

  const addNew = async () => {
    if (!canAdd) return;
    setSaving(newKey);
    try {
      const res = await fetch(`/api/settings/${encodeURIComponent(newKey.trim())}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newVal }),
      });
      if (!res.ok) throw new Error(await res.text());
      setNewKey(""); setNewVal(0);
      await fetchAll();
    } catch (e) {
      console.error(e);
      setErr(`Gagal tambah: ${newKey}`);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Threshold Settings</h1>

      {err && <div className="mb-3 text-red-600">{err}</div>}
      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-[720px] w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 w-[45%]">Key</th>
                  <th className="text-left px-4 py-3 w-[35%]">Value</th>
                  <th className="text-left px-4 py-3 w-[20%]">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t">
                    <td className="px-4 py-3 font-medium">{r.key}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        className="border rounded px-2 py-1 w-36"
                        value={Number.isFinite(r.value) ? r.value : 0}
                        onChange={(e) => updateLocal(r.key, parseInt(e.target.value || "0", 10))}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => saveOne(r.key)}
                        disabled={saving === r.key}
                        className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {saving === r.key ? "Saving…" : "Save"}
                      </button>
                    </td>
                  </tr>
                ))}
                {/* baris tambah */}
                <tr className="border-t bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      placeholder="new_key_name"
                      className="border rounded px-2 py-1 w-full"
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-36"
                      value={newVal}
                      onChange={(e) => setNewVal(parseInt(e.target.value || "0", 10))}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={addNew}
                      disabled={!canAdd || saving !== null}
                      className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-sm text-gray-500 mt-3">
            Tips: isi key lalu <em>Add</em> untuk bikin baris baru. Klik <em>Save</em> per baris untuk update value.
          </p>
        </>
      )}
    </div>
  );
}
