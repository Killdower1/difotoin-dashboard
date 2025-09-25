"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function EditLoc({ params }:{ params:{ name:string } }){
  const slug = decodeURIComponent(params.name);
  const [originalName] = useState(slug);
  const [name,setName]=useState(slug); const [zone,setZone]=useState(""); const [anchor,setAnchor]=useState(""); const [feature,setFeature]=useState("");
  const [sign,setSign]=useState(""); const [los,setLos]=useState<number|''>(''); const [power,setPower]=useState<number|''>(''); const [permit,setPermit]=useState<number|''>(''); const [notes,setNotes]=useState("");
  const [msg,setMsg]=useState(""); const router=useRouter();

  useEffect(()=>{ (async()=>{
    const r = await fetch("/api/admin/location-details",{cache:"no-store"});
    if(r.ok){ const list = await r.json(); const f = list.find((x:any)=>String(x.name).trim()===slug);
      if(f){ setName(f.name); setZone(f.floor_or_zone||""); setAnchor(f.nearby_anchor||""); setFeature(f.nearby_feature||""); setSign(f.signage_available||"");
        setLos(f.los_1to5 ?? ""); setPower(f.power_1to5 ?? ""); setPermit(f.permit_1to5 ?? ""); setNotes(f.notes||""); }
    }
  })(); },[slug]);

  async function submit(e:React.FormEvent){ e.preventDefault();
    const r = await fetch("/api/admin/location-details/upsert",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({
      originalName, name, floor_or_zone:zone, nearby_anchor:anchor, nearby_feature:feature, signage_available:sign,
      los_1to5: Number(los||0), power_1to5: Number(power||0), permit_1to5: Number(permit||0), notes
    })});
    const j = await r.json(); if(r.ok){ router.push("/admin/location-details"); } else setMsg(j.error||"failed");
  }

  return (
    <main className="p-6 max-w-2xl">
      <h1 className="text-2xl font-semibold">Edit Location Detail</h1>
      <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm md:col-span-2" placeholder="Name *" value={name} onChange={e=>setName(e.target.value)}/>
        <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm" placeholder="Floor/Zone" value={zone} onChange={e=>setZone(e.target.value)}/>
        <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm" placeholder="Nearby Anchor" value={anchor} onChange={e=>setAnchor(e.target.value)}/>
        <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm" placeholder="Nearby Feature" value={feature} onChange={e=>setFeature(e.target.value)}/>
        <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm" placeholder="Signage Available (Yes/No)" value={sign} onChange={e=>setSign(e.target.value)}/>
        <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm" type="number" placeholder="LOS 1..5" value={los} onChange={e=>setLos(e.target.value as any)}/>
        <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm" type="number" placeholder="Power 1..5" value={power} onChange={e=>setPower(e.target.value as any)}/>
        <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm" type="number" placeholder="Permit 1..5" value={permit} onChange={e=>setPermit(e.target.value as any)}/>
        <textarea className="min-h-[80px] rounded-2xl border bg-transparent px-3 py-2 text-sm md:col-span-2" placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)}/>
        <div className="md:col-span-2">
          <button className="h-10 px-4 rounded-2xl bg-white text-black text-sm font-medium">Save</button>
          {msg && <p className="text-sm mt-2">{msg}</p>}
        </div>
      </form>
    </main>
  );
}
