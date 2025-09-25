"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewUser(){
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [role,setRole]=useState("admin"); const [msg,setMsg]=useState("");
  const router = useRouter();

  async function submit(e:any){ e.preventDefault();
    const r = await fetch("/api/admin/users/upsert",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:u,password:p,role})});
    const j = await r.json(); if(r.ok){ router.push("/admin/users"); } else setMsg(j.error||"failed");
  }

  return (
    <main className="p-6 max-w-sm">
      <h1 className="text-2xl font-semibold">New User</h1>
      <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
        <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm" placeholder="Username" value={u} onChange={e=>setU(e.target.value)}/>
        <input type="password" className="h-10 rounded-2xl border bg-transparent px-3 text-sm" placeholder="Password" value={p} onChange={e=>setP(e.target.value)}/>
        <select className="h-10 rounded-2xl border bg-transparent px-3 text-sm" value={role} onChange={e=>setRole(e.target.value)}>
          <option value="admin">admin</option>
          <option value="viewer">viewer</option>
        </select>
        <button className="h-10 rounded-2xl bg-white text-black text-sm font-medium">Save</button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>
    </main>
  );
}
