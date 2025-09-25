"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function BootstrapUser(){
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [msg,setMsg]=useState("");
  const router=useRouter();
  async function submit(e:any){ e.preventDefault();
    const r = await fetch("/api/admin/users/bootstrap",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:u,password:p})});
    const j = await r.json(); if(r.ok){ router.push("/login"); } else setMsg(j.error||"failed");
  }
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-5">
        <h1 className="text-xl font-semibold">Create First Admin</h1>
        <p className="text-sm opacity-80">Halaman ini hanya berfungsi kalau belum ada user sama sekali.</p>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm" placeholder="Username" value={u} onChange={e=>setU(e.target.value)}/>
          <input type="password" className="h-10 rounded-2xl border bg-transparent px-3 text-sm" placeholder="Password" value={p} onChange={e=>setP(e.target.value)}/>
          <button className="h-10 rounded-2xl bg-white text-black text-sm font-medium">Create</button>
          {msg && <p className="text-sm">{msg}</p>}
        </form>
      </div>
    </main>
  );
}
