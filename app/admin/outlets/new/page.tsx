"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { VENUE_PARENTS, parentById } from "@/lib/venueTypes";

export default function NewOutlet(){
  const [name,setName]=useState("");
  const [area,setArea]=useState("");
  const [venueParent,setVenueParent]=useState("");
  const [venueSubType,setVenueSubType]=useState("");
  const [io,setIo]=useState("");
  const [msg,setMsg]=useState("");
  const router=useRouter();

  const children = useMemo(()=>{
    const p = parentById(venueParent);
    return p ? p.children : [];
  },[venueParent]);

  async function submit(e:React.FormEvent){ 
    e.preventDefault();
    const body = { name, area, venueParent, venueSubType, indoorOutdoor: io };
    const r = await fetch("/api/admin/outlets/upsert",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const j = await r.json(); if(r.ok){ router.push("/admin/outlets"); } else setMsg(j.error||"failed");
  }

  return (
    <main className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">New Outlet</h1>
      <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm md:col-span-2" placeholder="Name *" value={name} onChange={e=>setName(e.target.value)}/>
        <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm" placeholder="Area/Kota" value={area} onChange={e=>setArea(e.target.value)}/>

        <div>
          <label className="text-sm block mb-1">Venue Parent</label>
          <select className="h-10 w-full rounded-2xl border bg-transparent px-3 text-sm"
                  value={venueParent} onChange={e=>{ setVenueParent(e.target.value); setVenueSubType(""); }}>
            <option value="">Pilih parent…</option>
            {VENUE_PARENTS.map(p=>(
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm block mb-1">SubType (opsional)</label>
          <select className="h-10 w-full rounded-2xl border bg-transparent px-3 text-sm"
                  value={venueSubType} onChange={e=>setVenueSubType(e.target.value)} disabled={!children.length}>
            <option value="">{children.length? "Pilih subtype…" : "—"}</option>
            {children.map(c=>(
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        <select className="h-10 rounded-2xl border bg-transparent px-3 text-sm" value={io} onChange={e=>setIo(e.target.value)}>
          <option value="">Indoor/Outdoor</option>
          <option value="indoor">indoor</option>
          <option value="semi-outdoor">semi-outdoor</option>
          <option value="outdoor">outdoor</option>
        </select>

        <div className="md:col-span-2">
          <button className="h-10 px-4 rounded-2xl bg-white text-black text-sm font-medium">Save</button>
          {msg && <p className="text-sm mt-2">{msg}</p>}
        </div>
      </form>
    </main>
  );
}
