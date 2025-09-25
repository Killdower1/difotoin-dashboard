"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type User = { username:string; role:"admin"|"viewer" };

export default function UsersPage(){
  const [rows,setRows]=useState<User[]>([]);
  const [msg,setMsg]=useState("");

  async function load(){ const r = await fetch("/api/admin/users",{cache:"no-store"}); if(r.ok){ setRows(await r.json()); } }
  useEffect(()=>{ load(); },[]);

  async function del(user:string){
    if(!confirm('Delete "' + user + '"?')) return;
    const r = await fetch("/api/admin/users/delete",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:user})});
    const j = await r.json(); setMsg(r.ok? "Deleted" : (j.error||"Failed")); await load();
  }

  return (
    <main className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users</h1>
        <Link href="/admin/users/new" className="underline text-sm">+ New</Link>
      </div>
      {msg && <p className="text-sm mt-2">{msg}</p>}
      <div className="mt-4 rounded-2xl border overflow-auto">
        <table className="w-full text-sm">
          <thead><tr><th className="text-left p-3">Username</th><th className="text-left p-3">Role</th><th className="text-right p-3">Action</th></tr></thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.username} className="border-t">
                <td className="p-3">{r.username}</td>
                <td className="p-3">{r.role}</td>
                <td className="p-3 text-right">
                  <button onClick={()=>del(r.username)} className="underline opacity-80">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
