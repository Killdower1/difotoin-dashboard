"use client";

import { useEffect, useState } from "react";

export default function ThresholdPanel() {
  const [thresholds, setThresholds] = useState<{ key: string; value: number }[]>([]);

  useEffect(() => {
    fetch("/api/thresholds")
      .then((res) => res.json())
      .then(setThresholds);
  }, []);

  const handleSave = (key: string, value: number) => {
    fetch("/api/thresholds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    }).then(() => {
      alert("Saved!");
    });
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Threshold Settings</h1>
      <table className="table-auto border-collapse border border-gray-600 w-full">
        <thead>
          <tr>
            <th className="border p-2">Key</th>
            <th className="border p-2">Value</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {thresholds.map((t) => (
            <tr key={t.key}>
              <td className="border p-2">{t.key}</td>
              <td className="border p-2">
                <input
                  type="number"
                  defaultValue={t.value}
                  onChange={(e) => (t.value = Number(e.target.value))}
                  className="w-24 border px-2"
                />
              </td>
              <td className="border p-2">
                <button
                  onClick={() => handleSave(t.key, t.value)}
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                >
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
