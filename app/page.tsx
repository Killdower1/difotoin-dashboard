import Link from "next/link";
export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Difotoin — Tools</h1>
      <p className="text-sm text-muted-foreground">Buka dashboard review lokasi.</p>
      <div className="mt-4">
        <Link href="/dashboard" className="underline">Ke Dashboard</Link>
      </div>
    </main>
  );
}
