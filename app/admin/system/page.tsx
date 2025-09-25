"use client";
import { useState } from "react";

export default function SystemPage(){
  const [txtSoft,setTxtSoft]=useState("");
  const [msgSoft,setMsgSoft]=useState("");
  const [busySoft,setBusySoft]=useState(false);

  const [txtHard,setTxtHard]=useState("");
  const [msgHard,setMsgHard]=useState("");
  const [busyHard,setBusyHard]=useState(false);

  const canSoft = txtSoft === "RESET";
  const canHard = txtHard === "DELETE";

  async function softReset(){
    if(!canSoft || busySoft) return;
    setBusySoft(true); setMsgSoft("Resetting…");
    try{
      const r = await fetch("/api/admin/system/soft-reset",{ method:"POST" });
      const j = await r.json();
      if(r.ok){
        setMsgSoft("Selesai. Metrics & periods dibersihkan. Backup: " + (j.backupPath || ""));
      } else {
        setMsgSoft(j.error || "Reset gagal");
      }
    }catch(e:any){
      setMsgSoft("Reset gagal: " + String(e?.message || e));
    }finally{
      setBusySoft(false);
    }
  }

  async function hardReset(){
    if(!canHard || busyHard) return;
    setBusyHard(true); setMsgHard("Resetting…");
    try{
      const r = await fetch("/api/admin/system/reset",{ method:"POST" });
      const j = await r.json();
      if(r.ok){
        setMsgHard("Selesai. Redirect ke halaman login…");
        setTimeout(()=>{ window.location.href = "/login"; }, 800);
      }else{
        setMsgHard(j.error || "Reset gagal");
      }
    }catch(e:any){
      setMsgHard("Reset gagal: " + String(e?.message || e));
    }finally{
      setBusyHard(false);
    }
  }

  return (
    <main className="p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold">System</h1>

      {/* Soft Reset */}
      <div className="mt-4 rounded-2xl border p-4">
        <div className="text-lg font-medium">Soft Reset (Safe)</div>
        <p className="text-sm opacity-80 mt-1">
          Hapus <b>metrics snapshot</b> dan seluruh folder <code>data/periods/</code>. Data referensi tetap aman:
          <code> outlets_master.json</code>, <code> outlet_alias.json</code>, <code> location_details.json</code>, dan <code>users.json</code>. 
          Semua yang dihapus akan dibackup ke <code>backups/metrics-deleted-YYYYMMDD-HHMMSS</code>.
        </p>
        <div className="mt-3">
          <label className="text-sm block mb-1">Konfirmasi (ketik: RESET)</label>
          <input className="h-10 w-full rounded-2xl border bg-transparent px-3 text-sm"
                 placeholder="RESET"
                 value={txtSoft} onChange={(e)=>setTxtSoft(e.target.value)} />
        </div>
        <div className="mt-3">
          <button onClick={softReset} disabled={!canSoft || busySoft}
                  className={"h-10 px-4 rounded-2xl text-sm font-medium " + (canSoft && !busySoft ? "bg-white text-black" : "bg-muted text-muted-foreground cursor-not-allowed")}>
            {busySoft ? "Processing…" : "Soft Reset Now"}
          </button>
          {msgSoft && <p className="text-sm mt-2">{msgSoft}</p>}
        </div>
      </div>

      {/* Hard Reset */}
      <div className="mt-4 rounded-2xl border p-4">
        <div className="text-lg font-medium">Hard Reset (Danger)</div>
        <p className="text-sm opacity-80 mt-1">
          Pindahkan seluruh folder <code>data/</code> ke backup <code>backups/data-deleted-YYYYMMDD-HHMMSS</code> 
          lalu <b>logout</b>. Ini juga menghapus <code>users.json</code>. Setelah itu buka <code>/login</code> dan buat admin baru.
        </p>
        <div className="mt-3">
          <label className="text-sm block mb-1">Konfirmasi (ketik: DELETE)</label>
          <input className="h-10 w-full rounded-2xl border bg-transparent px-3 text-sm"
                 placeholder="DELETE"
                 value={txtHard} onChange={(e)=>setTxtHard(e.target.value)} />
        </div>
        <div className="mt-3">
          <button onClick={hardReset} disabled={!canHard || busyHard}
                  className={"h-10 px-4 rounded-2xl text-sm font-medium " + (canHard && !busyHard ? "bg-white text-black" : "bg-muted text-muted-foreground cursor-not-allowed")}>
            {busyHard ? "Processing…" : "Hard Reset Now"}
          </button>
          {msgHard && <p className="text-sm mt-2">{msgHard}</p>}
        </div>

        <div className="mt-4 rounded-xl border px-3 py-2 text-sm">
          <div className="font-medium">Setelah reset:</div>
          <ol className="list-decimal pl-5 space-y-1 mt-1">
            <li>Untuk Soft Reset: langsung upload ulang data di <code>/admin/upload</code>.</li>
            <li>Untuk Hard Reset: buka <code>/login</code> lalu "Create first admin", kemudian upload ulang.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
