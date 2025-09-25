"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Upload, FileCheck2, MapPin, Settings, UserRound, LogOut, ShieldAlert } from "lucide-react";
import React from "react";

type NavItem = { href: string; label: string; icon: React.ComponentType<{className?: string}> };

const NAV: NavItem[] = [
  { href: "/admin",               label: "Admin Home",        icon: Home },
  { href: "/admin/upload",        label: "Upload Data",       icon: Upload },
  { href: "/admin/validate",      label: "Validation Preview",icon: FileCheck2 },
  { href: "/admin/outlets",       label: "Outlet Master",     icon: MapPin },
  { href: "/admin/location-details", label: "Location Details", icon: Settings },
  { href: "/admin/users",         label: "Users",             icon: UserRound },
  { href: "/admin/system",        label: "System",            icon: ShieldAlert },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  function isActive(href: string) { return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href); }

  async function logout(){
    await fetch("/api/auth/logout",{method:"POST"});
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="md:hidden sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="font-semibold">Difotoin — Admin</div>
          <div className="flex items-center gap-2">
            <button onClick={logout} className="p-2 rounded-lg border">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 md:px-6 py-4 md:py-6 grid grid-cols-1 md:grid-cols-[240px_1fr] gap-4">
        <aside className="hidden md:block">
          <div className="sticky top-4 rounded-2xl border">
            <div className="px-4 py-3 border-b">
              <div className="text-sm uppercase tracking-wide opacity-70">Admin</div>
              <div className="text-lg font-semibold">Difotoin</div>
            </div>
            <nav className="p-2">
              {NAV.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}
                    className={"flex items-center gap-3 px-3 py-2 rounded-xl text-sm " + (active ? "bg-foreground text-background font-medium" : "hover:bg-muted")}>
                    <Icon className="h-4 w-4" /><span>{item.label}</span>
                  </Link>
                );
              })}
              <div className="px-3 py-2">
                <button onClick={logout} className="w-full h-9 rounded-xl border text-sm flex items-center justify-center gap-2">
                  <LogOut className="h-4 w-4"/><span>Logout</span>
                </button>
              </div>
            </nav>
          </div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
