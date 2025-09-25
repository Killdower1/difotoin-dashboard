"use client";
import Link from "next/link";
import { Upload, FileCheck2, MapPin, Settings, ShieldAlert } from "lucide-react";

export default function AdminHome(){
  const cards = [
    { href: "/admin/upload", icon: Upload, title: "Upload Data Bulanan", desc: "Unggah CSV/XLSX, pilih period, dan (opsional) set sebagai latest snapshot." },
    { href: "/admin/validate", icon: FileCheck2, title: "Validation Preview", desc: "Dry-run: cek mapping event, period, jam, unmatched outlets & unknown event labels." },
    { href: "/admin/outlets", icon: MapPin, title: "Outlet Master", desc: "Kelola nama outlet baku + Area, Venue Parent/SubType, Indoor/Outdoor." },
    { href: "/admin/location-details", icon: Settings, title: "Location Details", desc: "Catatan titik: zone/floor, anchor, signage, LOS/power/permit, notes." },
    { href: "/admin/system", icon: ShieldAlert, title: "System & Reset", desc: "Backup dan reset data: Soft/Hard reset." }
  ];

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border px-4 py-3">
        <h1 className="text-xl md:text-2xl font-semibold">Admin Home</h1>
        <p className="text-sm opacity-80">Semua panel administrasi difokuskan ke data lokasi & ingest bulanan.</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <Link key={c.href + idx} href={c.href} className="rounded-2xl border p-4 hover:bg-muted block">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl border flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-medium">{c.title}</div>
                  <div className="text-sm opacity-80">{c.desc}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl border px-4 py-3">
        <div className="text-sm font-semibold mb-2">Tips</div>
        <ul className="list-disc pl-5 text-sm space-y-1">
          <li>Gunakan <span className="font-medium">Validation Preview</span> sebelum ingest.</li>
          <li>Isi <span className="font-medium">Venue Parent</span>; SubType opsional.</li>
          <li>Upload period lama tanpa <em>Set as latest</em> agar snapshot berjalan aman.</li>
        </ul>
      </section>
    </div>
  );
}
