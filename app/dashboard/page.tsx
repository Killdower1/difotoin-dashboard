"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Camera, Printer, TrendingUp, Sun, Moon, Filter, Activity, Info, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { THRESHOLDS } from "@/lib/classifier";

type OutletClass = "keeper" | "optimize-conversion" | "relocate-candidate" | "check-uptime/ops" | "monitor" | "investigate-data";

type PrevBlock = {
  foto: number; unlock: number; print: number;
  activeRatio: number; conv: number; class: string;
};

type DeltaBlock = {
  foto: number; fotoPct: number|null;
  unlock: number; print: number;
  activeRatio: number; conv: number;
  statusChange: "same"|"upgrade"|"downgrade";
  trendingUp: boolean; trendingDown: boolean;
};

type OutletRow = {
  outlet: string;
  area?: string;
  venueType?: string;       // kompat: parent bisa ditaruh di sini
  venueParent?: string;     // skema baru
  venueSubType?: string;
  indoorOutdoor?: string;   // indoor | semi-outdoor | outdoor
  foto?: number;
  unlock?: number;
  print?: number;
  activeRatio?: number;     // 0..1
  weekendShare?: number;    // 0..1
  eveningPeakShare?: number;// 0..1 (17–21)
  class?: OutletClass;
  classReason?: string;     // dari API classifier
  _prev?: PrevBlock;
  _delta?: DeltaBlock;
};

function fmtPct(v?: number) {
  const n = Number(v ?? 0);
  if (!isFinite(n) || n <= 0) return "–";
  return Math.round(n * 100) + "%";
}
function fmtPctSigned(v?: number|null) {
  if (v == null || !isFinite(Number(v))) return "–";
  const n = Number(v)*100;
  const s = n > 0 ? "+" : n < 0 ? "" : "";
  return s + Math.round(n) + "%";
}
function num(n:any){ const v = Number(n||0); return isFinite(v) ? v : 0; }

function useThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add("dark"); else root.classList.remove("dark");
  }, [dark]);
  return { dark, setDark };
}

// Placeholder jam (bisa diganti data nyata)
const hourlyFotoData = Array.from({ length: 24 }, (_, h) => ({
  hour: h,
  foto: Math.max(0, Math.round((Math.sin((h - 8) / 24 * Math.PI * 2) + 1) * 120 + (h > 16 && h < 22 ? 80 : 0)))
}));

function Delta({v, isPct=false}: {v:number|null|undefined, isPct?:boolean}) {
  if (v == null || !isFinite(Number(v)) || Number(v) === 0) {
    return <span className="inline-flex items-center gap-1 text-muted-foreground"><Minus className="h-3 w-3" />–</span>;
  }
  const n = Number(v);
  const up = n > 0;
  const cls = up ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  const val = isPct ? fmtPctSigned(n) : (n>0? "+"+n.toLocaleString("id-ID") : n.toLocaleString("id-ID"));
  return <span className={`inline-flex items-center gap-1 font-medium ${cls}`}><Icon className="h-3 w-3"/>{val}</span>;
}

export default function LocationReviewDashboard() {
  const { dark, setDark } = useThemeToggle();

  // ===== state =====
  const [period, setPeriod] = useState<string>("latest");
  const [compare, setCompare] = useState<string>("none");
  const [rows, setRows] = useState<OutletRow[]>([]);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState<string>("all");
  const [venueType, setVenueType] = useState<string>("all");
  const [io, setIo] = useState<string>("all"); // indoor/outdoor
  const [sortBy, setSortBy] = useState<string>("foto_desc");
  const [activeTab, setActiveTab] = useState<string>("keeper");
  const [limit, setLimit] = useState<number>(99999); // tampil ALL

  // load data dari API (sudah memakai normalizer & classifier, plus compare jika dipilih)
  useEffect(()=>{ (async ()=>{
    const q = new URLSearchParams();
    q.set("period", period);
    if (compare !== "none") q.set("compare", compare);
    const r = await fetch("/api/metrics/outlets?" + q.toString(), { cache:"no-store" });
    const j = await r.json();
    setRows(Array.isArray(j) ? j : []);
  })(); }, [period, compare]);

  // derive filter options
  const areas = useMemo(() => Array.from(new Set(rows.map(o => o.area).filter(Boolean))) as string[], [rows]);
  const venueTypes = useMemo(() => Array.from(new Set((rows.map(o => o.venueParent || o.venueType)).filter(Boolean))) as string[], [rows]);

  // sorting
  const sorter: Record<string, (a: OutletRow, b: OutletRow) => number> = {
    foto_desc:   (a,b) => num(b.foto) - num(a.foto),
    unlock_desc: (a,b) => num(b.unlock) - num(a.unlock),
    print_desc:  (a,b) => num(b.print) - num(a.print),
    conv_desc:   (a,b) => ((num(b.foto)>0? num(b.unlock)/num(b.foto):0) - (num(a.foto)>0? num(a.unlock)/num(a.foto):0)),
    active_desc: (a,b) => num(b.activeRatio) - num(a.activeRatio),
    outlet_asc:  (a,b) => String(a.outlet||"").localeCompare(String(b.outlet||"")),
    dFoto_desc:  (a,b) => num(b._delta?.foto) - num(a._delta?.foto),
    dFotoPct_desc: (a,b) => num(b._delta?.fotoPct) - num(a._delta?.fotoPct),
  };

  // filter + sort
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = rows.filter(o => (
      (area === "all" || o.area === area) &&
      (venueType === "all" || (o.venueParent || o.venueType) === venueType) &&
      (io === "all" || o.indoorOutdoor === io) &&
      (
        activeTab === "all" ? true :
        activeTab === "trending-up" ? Boolean(o._delta?.trendingUp) :
        activeTab === "trending-down" ? Boolean(o._delta?.trendingDown) :
        (o.class || "monitor") === activeTab
      ) &&
      (q === "" || String(o.outlet||"").toLowerCase().includes(q))
    ));
    const s = sorter[sortBy] || sorter.foto_desc;
    arr.sort(s);
    return arr;
  }, [rows, query, area, venueType, io, activeTab, sortBy]);

  // KPI aggregate (tanpa delta; delta ditampilkan per-row)
  const kpi = useMemo(() => {
    const list = filtered.length ? filtered : rows;
    const foto   = list.reduce((s, r) => s + num(r.foto), 0);
    const unlock = list.reduce((s, r) => s + num(r.unlock), 0);
    const print  = list.reduce((s, r) => s + num(r.print), 0);
    const conv   = foto > 0 ? unlock / foto : 0;
    const activeAvg = list.reduce((s, r) => s + num(r.activeRatio), 0) / Math.max(1, list.length);
    const evening = list.reduce((s, r) => s + num(r.eveningPeakShare), 0) / Math.max(1, list.length);
    return { outlets: list.length, foto, unlock, print, conv, activeAvg, evening };
  }, [filtered, rows]);

  // tabs (tambah "monitor", dan jika compare aktif: trending up/down)
  const baseTabs = [
    { key: "keeper", label: "Keepers" },
    { key: "optimize-conversion", label: "Optimize Conversion" },
    { key: "relocate-candidate", label: "Relocate" },
    { key: "check-uptime/ops", label: "Check Uptime/Ops" },
    { key: "monitor", label: "Monitor" },
    { key: "all", label: "All" },
  ];
  const trendTabs = compare === "none" ? [] : [
    { key: "trending-up", label: "Trending Up" },
    { key: "trending-down", label: "Trending Down" },
  ];
  const tabs = [...baseTabs.slice(0,4), ...trendTabs, ...baseTabs.slice(4)];

  const tabCounts = useMemo(() => {
    const base: Record<string, number> = { all: rows.length };
    for (const t of ["keeper","optimize-conversion","relocate-candidate","check-uptime/ops","monitor"] as const) {
      base[t] = rows.filter(o => (o.class||"monitor") === t).length;
    }
    if (compare !== "none") {
      base["trending-up"] = rows.filter(o => o._delta?.trendingUp).length;
      base["trending-down"] = rows.filter(o => o._delta?.trendingDown).length;
    }
    return base;
  }, [rows, compare]);

  // daftar periode (silakan tambah sesuai data yang ada)
  const periods = ["latest","2025-09","2025-08","2025-07","2025-06"];
  const compareOptions = periods.filter(p => p !== "latest" && p !== period);

  // apakah compare aktif?
  const compareOn = compare !== "none";

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background text-foreground p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Difotoin — Location Review Dashboard</h1>
            <p className="text-sm text-muted-foreground">Price-agnostic. Fokus evaluasi titik berdasarkan perilaku Foto → Unlock → Print.</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Period" /></SelectTrigger>
              <SelectContent>
                {periods.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={compare} onValueChange={setCompare}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Compare" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Compare</SelectItem>
                {compareOptions.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="hidden md:flex items-center gap-2">
              <Input placeholder="Cari outlet…" value={query} onChange={(e) => setQuery(e.target.value)} className="w-[220px]" />
            </div>
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <Switch checked={dark} onCheckedChange={setDark} />
              <Moon className="h-4 w-4" />
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Select value={area} onValueChange={setArea}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Area" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Area</SelectItem>
              {areas.map(a => (<SelectItem key={a} value={a}>{a}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={venueType} onValueChange={setVenueType}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Venue Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {venueTypes.map(v => (<SelectItem key={v} value={v}>{v}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={io} onValueChange={setIo}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Indoor/Outdoor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Indoor & Outdoor</SelectItem>
              <SelectItem value="indoor">Indoor</SelectItem>
              <SelectItem value="semi-outdoor">Semi-Outdoor</SelectItem>
              <SelectItem value="outdoor">Outdoor</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="foto_desc">Sort: Foto (desc)</SelectItem>
              <SelectItem value="unlock_desc">Sort: Unlock (desc)</SelectItem>
              <SelectItem value="print_desc">Sort: Print (desc)</SelectItem>
              <SelectItem value="conv_desc">Sort: Conversion (desc)</SelectItem>
              <SelectItem value="active_desc">Sort: Active Ratio (desc)</SelectItem>
              {compareOn && <>
                <SelectItem value="dFoto_desc">Sort: Δ Foto (desc)</SelectItem>
                <SelectItem value="dFotoPct_desc">Sort: Δ Foto % (desc)</SelectItem>
              </>}
              <SelectItem value="outlet_asc">Sort: A–Z</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="w-full"><Filter className="h-4 w-4 mr-2"/>Advanced Filters</Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Outlets</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <MapPin className="h-5 w-5"/>
              <div className="text-2xl font-bold">{kpi.outlets}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Foto</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <Camera className="h-5 w-5"/>
              <div className="text-2xl font-bold">{num(kpi.foto).toLocaleString("id-ID")}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Unlock</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <Activity className="h-5 w-5"/>
              <div className="text-2xl font-bold">{num(kpi.unlock).toLocaleString("id-ID")}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Print</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <Printer className="h-5 w-5"/>
              <div className="text-2xl font-bold">{num(kpi.print).toLocaleString("id-ID")}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Avg Conversion</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5"/>
              <div className="text-2xl font-bold">{fmtPct(kpi.conv)}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Evening Peak (17–21)</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              <Sun className="h-5 w-5"/>
              <div className="text-2xl font-bold">{fmtPct(kpi.evening)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Body: Tabs + Table + Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
          <div className="xl:col-span-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle>Outlet Leaderboard</CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8">
                          <Info className="h-4 w-4 mr-2" /> Rules
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[720px]">
                        <DialogHeader>
                          <DialogTitle>Ambang Klasifikasi</DialogTitle>
                        </DialogHeader>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Semua ambang diambil langsung dari <code>lib/classifier.ts</code> (single source of truth).
                        </div>
                        <div className="mt-4 overflow-hidden rounded-md border">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left p-2 w-[220px]">Status</th>
                                <th className="text-left p-2">Kriteria</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="p-2 font-medium">Check Uptime/Ops</td>
                                <td className="p-2">Active Ratio &lt; {Math.round(THRESHOLDS.ACTIVE_LOW*100)}%</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-medium">Keeper</td>
                                <td className="p-2">
                                  Foto ≥ {THRESHOLDS.KEEPER_MIN_FOTO}<br/>
                                  atau (Foto ≥ {THRESHOLDS.KEEPER_MIX_FOTO} &amp; Conversion ≥ {Math.round(THRESHOLDS.KEEPER_MIX_CONV*100)}% &amp; Active Ratio ≥ {Math.round(THRESHOLDS.KEEPER_MIX_ACTIVE*100)}%)
                                </td>
                              </tr>
                              <tr>
                                <td className="p-2 font-medium">Optimize Conversion</td>
                                <td className="p-2">Foto ≥ {THRESHOLDS.OPT_MIN_FOTO} &amp; Conversion &lt; {Math.round(THRESHOLDS.OPT_MAX_CONV*100)}%</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-medium">Relocate</td>
                                <td className="p-2">{THRESHOLDS.RELOC_MIN_FOTO} ≤ Foto &lt; {THRESHOLDS.RELOC_MAX_FOTO_EXCLUSIVE}</td>
                              </tr>
                              <tr>
                                <td className="p-2 font-medium">Monitor</td>
                                <td className="p-2">Default jika tidak memenuhi kriteria di atas</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
                    <TabsList className="grid grid-cols-8">
                      {tabs.map(t => (
                        <TabsTrigger key={t.key} value={t.key} className="text-xs">
                          {t.label}
                          <Badge variant="secondary" className="ml-2">{tabCounts[t.key] ?? 0}</Badge>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-auto rounded-md border mt-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[20%]">Outlet</TableHead>
                        <TableHead>Area</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Foto</TableHead>
                        {compareOn && <TableHead className="text-right">Δ Foto</TableHead>}
                        <TableHead className="text-right">Unlock</TableHead>
                        {compareOn && <TableHead className="text-right">Δ Unlock</TableHead>}
                        <TableHead className="text-right">Print</TableHead>
                        {compareOn && <TableHead className="text-right">Δ Print</TableHead>}
                        <TableHead className="text-right">Conv</TableHead>
                        {compareOn && <TableHead className="text-right">Δ Conv</TableHead>}
                        <TableHead className="text-right">Active</TableHead>
                        {compareOn && <TableHead className="text-right">Δ Active</TableHead>}
                        <TableHead className="text-right">Weekend</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.slice(0, limit).map((o) => {
                        const conv = num(o.foto) ? num(o.unlock) / num(o.foto) : 0;
                        return (
                          <TableRow key={o.outlet}>
                            <TableCell>
                              <div className="font-medium">{o.outlet}</div>
                              <div className="text-xs text-muted-foreground">{o.indoorOutdoor||""}</div>
                            </TableCell>
                            <TableCell>{o.area||""}</TableCell>
                            <TableCell>{o.venueParent || o.venueType || ""}</TableCell>
                            <TableCell className="text-right">{num(o.foto).toLocaleString("id-ID")}</TableCell>
                            {compareOn && <TableCell className="text-right"><Delta v={o._delta?.foto} /></TableCell>}
                            <TableCell className="text-right">{num(o.unlock).toLocaleString("id-ID")}</TableCell>
                            {compareOn && <TableCell className="text-right"><Delta v={o._delta?.unlock} /></TableCell>}
                            <TableCell className="text-right">{num(o.print).toLocaleString("id-ID")}</TableCell>
                            {compareOn && <TableCell className="text-right"><Delta v={o._delta?.print} /></TableCell>}
                            <TableCell className="text-right">{fmtPct(conv)}</TableCell>
                            {compareOn && <TableCell className="text-right"><Delta v={o._delta?.conv} isPct /></TableCell>}
                            <TableCell className="text-right">{fmtPct(num(o.activeRatio))}</TableCell>
                            {compareOn && <TableCell className="text-right"><Delta v={o._delta?.activeRatio} isPct /></TableCell>}
                            <TableCell className="text-right">{fmtPct(num(o.weekendShare))}</TableCell>
                            <TableCell>
                              <StatusBadge
                                value={(o.class||"monitor") as OutletClass}
                                reason={`${o.classReason||""}${o._prev ? ` | Prev: ${o._prev.class}` : ""}`}
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button size="sm" variant="outline">Detail</Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Menampilkan {Math.min(limit, filtered.length)} dari {filtered.length} outlet.</span>
                  <div className="space-x-2">
                    <Button variant="outline" className="h-5 p-0" onClick={()=>setLimit(20)}>20</Button>
                    <Button variant="outline" className="h-5 p-0" onClick={()=>setLimit(50)}>50</Button>
                    <Button variant="outline" className="h-5 p-0" onClick={()=>setLimit(100)}>100</Button>
                    <Button variant="outline" className="h-5 p-0" onClick={()=>setLimit(99999)}>All</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column: Charts */}
          <div className="flex flex-col gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Distribusi Foto per Jam</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[260px] text-xs">Aggregasi sederhana untuk melihat jam emas secara umum. Versi data nyata akan dihitung dari event Foto harian.</TooltipContent>
                </Tooltip>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyFotoData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickFormatter={(v) => String(v)} />
                    <YAxis />
                    <RTooltip formatter={(v: any) => [v, "Foto"]} labelFormatter={(l: any) => "Jam " + String(l) + ":00"} />
                    <Bar dataKey="foto" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Share Weekend vs Weekday</CardTitle></CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={buildWeekendAgg(filtered.length ? filtered : rows)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(v) => Math.round(Number(v||0)*100) + "%"} domain={[0,1]} />
                    <Legend />
                    <RTooltip formatter={(v: any) => Math.round(Number(v||0)*100) + "%"} />
                    <Bar dataKey="weekday" name="Weekday" />
                    <Bar dataKey="weekend" name="Weekend" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          <p>Tip: Buka tab <em>Trending Up</em> / <em>Trending Down</em> setelah memilih Compare untuk fokus ke outlet yang naik/turun signifikan.</p>
        </div>
      </div>
    </TooltipProvider>
  );
}

function StatusBadge({ value, reason }: { value: OutletClass, reason?: string }) {
  const map: Record<OutletClass, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    "keeper": { label: "Keeper", variant: "default" },
    "optimize-conversion": { label: "Optimize", variant: "secondary" },
    "relocate-candidate": { label: "Relocate", variant: "destructive" },
    "check-uptime/ops": { label: "Check Uptime/Ops", variant: "outline" },
    "monitor": { label: "Monitor", variant: "secondary" },
    "investigate-data": { label: "Investigate", variant: "outline" },
  };
  const cfg = map[value] ?? map["monitor"];

  const badge = <Badge variant={cfg.variant}>{cfg.label}</Badge>;
  if (!reason) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent className="max-w-[260px] text-xs whitespace-pre-line">{reason}</TooltipContent>
    </Tooltip>
  );
}

function buildWeekendAgg(list: OutletRow[]) {
  const weekday = list.reduce((s, r) => s + (r.weekendShare != null ? 1 - (Number(r.weekendShare)||0) : 0.5), 0) / Math.max(1, list.length);
  const weekend = 1 - weekday;
  return [ { label: "All Outlets (filtered)", weekday, weekend } ];
}
