"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage(){
  const [u,setU]=useState(""); const [p,setP]=useState(""); const [msg,setMsg]=useState("");
  const [showBootstrap,setShowBootstrap]=useState(false);
  const router = useRouter(); const search = useSearchParams();
  const redirectTo = search.get("redirect") || "/admin";

  useEffect(()=>{ (async()=>{
    try{
      const r = await fetch("/api/auth/need-bootstrap",{cache:"no-store"});
      const j = await r.json();
      setShowBootstrap(!!j?.needBootstrap);
    }catch{ setShowBootstrap(false); }
  })(); },[]);

  async function submit(e:any){ e.preventDefault(); setMsg("Signing in...");
    const r = await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:u,password:p})});
    const j = await r.json();
    if(r.ok){ router.push(redirectTo); } else setMsg(j.error||"login failed");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border p-5">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
          <input className="h-10 rounded-2xl border bg-transparent px-3 text-sm" placeholder="Username" value={u} onChange={e=>setU(e.target.value)}/>
          <input type="password" className="h-10 rounded-2xl border bg-transparent px-3 text-sm" placeholder="Password" value={p} onChange={e=>setP(e.target.value)}/>
          <button className="h-10 rounded-2xl bg-white text-black text-sm font-medium">Login</button>
          {msg && <p className="text-sm">{msg}</p>}
        </form>
        {showBootstrap && (
          <div className="mt-3 text-sm">
            Belum ada admin? <a href="/admin/users/bootstrap" className="underline">Create first admin</a>
          </div>
        )}
      </div>
    </main>
  );
}
