"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

type T = {
  CLASS_KEEPER_FOTO_MIN_A: number;
  CLASS_KEEPER_FOTO_MIN_B: number;
  CLASS_KEEPER_CONV_MIN_B: number;
  CLASS_OPTIMIZE_FOTO_MIN: number;
  CLASS_OPTIMIZE_CONV_MAX: number;
  CLASS_RELOCATE_FOTO_MIN: number;
  CLASS_RELOCATE_FOTO_MAX: number;
};

export default function ClassifierInfo() {
  const [t, setT] = useState<T | null>(null);

  useEffect(() => {
    fetch("/api/classifier-thresholds", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setT(d.data as T))
      .catch(() => setT(null));
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Klasifikasi Info</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Aturan Klasifikasi (Bulanan, tanpa Active Ratio)</DialogTitle>
        </DialogHeader>

        {!t ? (
          <div className="text-sm text-muted-foreground">Memuat ambang dari Settings…</div>
        ) : (
          <div className="text-sm space-y-4">
            <p>Conversion = <code>unlock / foto × 100%</code>. Semua angka di bawah ditarik real-time dari <code>Settings</code> (/admin/classifier).</p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="font-medium">KEEPER</div>
              <div>
                Foto ≥ {t.CLASS_KEEPER_FOTO_MIN_A}<br />
                atau (Foto ≥ {t.CLASS_KEEPER_FOTO_MIN_B} &amp; Conv ≥ {t.CLASS_KEEPER_CONV_MIN_B}%)
              </div>

              <div className="font-medium">OPTIMIZE CONVERSION</div>
              <div>Foto ≥ {t.CLASS_OPTIMIZE_FOTO_MIN} &amp; Conv &lt; {t.CLASS_OPTIMIZE_CONV_MAX}%</div>

              <div className="font-medium">RELOCATE</div>
              <div>{t.CLASS_RELOCATE_FOTO_MIN} ≤ Foto &lt; {t.CLASS_RELOCATE_FOTO_MAX}</div>

              <div className="font-medium">MONITOR</div>
              <div>Jika tidak memenuhi kriteria di atas</div>
            </div>

            <ul className="list-disc pl-5 text-muted-foreground">
              <li>Klasifikasi dihitung dari total <em>bulanan</em> per outlet.</li>
              <li>Perubahan nilai di <code>/admin/classifier</code> langsung mempengaruhi hasil di dashboard.</li>
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
