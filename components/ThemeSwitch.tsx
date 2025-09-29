"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeSwitch(){
  const [dark, setDark] = useState(false);
  useEffect(()=>{
    const root = document.documentElement;
    if (dark) root.classList.add("dark"); else root.classList.remove("dark");
    document.cookie = `theme=${dark?'dark':'light'}; path=/; max-age=${60*60*24*365}`;
  }, [dark]);
  return (
    <button
      aria-label="Toggle theme"
      onClick={()=>setDark(v=>!v)}
      className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-md border"
    >
      {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      <span>{dark? 'Dark':'Light'}</span>
    </button>
  );
}
