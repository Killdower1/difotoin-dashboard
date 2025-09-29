import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const KEYS = [
  "CLASS_KEEPER_FOTO_MIN_A",
  "CLASS_KEEPER_FOTO_MIN_B",
  "CLASS_KEEPER_CONV_MIN_B",
  "CLASS_OPTIMIZE_FOTO_MIN",
  "CLASS_OPTIMIZE_CONV_MAX",
  "CLASS_RELOCATE_FOTO_MIN",
  "CLASS_RELOCATE_FOTO_MAX",
] as const;

const DEFAULTS: Record<string, number> = {
  CLASS_KEEPER_FOTO_MIN_A: 1000,
  CLASS_KEEPER_FOTO_MIN_B: 600,
  CLASS_KEEPER_CONV_MIN_B: 40,
  CLASS_OPTIMIZE_FOTO_MIN: 600,
  CLASS_OPTIMIZE_CONV_MAX: 30,
  CLASS_RELOCATE_FOTO_MIN: 1,
  CLASS_RELOCATE_FOTO_MAX: 200,
};

export async function GET() {
  const rows = await prisma.setting.findMany({
    where: { key: { in: KEYS as unknown as string[] } },
    select: { key: true, value: true },
  });
  const map: Record<string, number> = {};
  for (const k of KEYS) {
    const found = rows.find((r: any) => r.key === k);
    map[k] = typeof found?.value === "number" ? found.value : DEFAULTS[k as string];
  }
  return NextResponse.json({ data: map });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const updates: Array<{ key: string; value: number }> = [];

  for (const k of KEYS) {
    if (k in body) {
      const n = Number((body as any)[k]);
      if (!Number.isNaN(n)) {
        // simpan sebagai int di DB (pembulatan ke terdekat)
        updates.push({ key: k as string, value: Math.round(n) });
      }
    }
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "no valid keys" }, { status: 400 });
  }

  for (const u of updates) {
    await prisma.setting.upsert({
      where: { key: u.key },       // key adalah @id (unique) → aman untuk upsert
      update: { value: u.value },  // <<< Int, bukan String
      create: { key: u.key, value: u.value },
    });
  }

  return NextResponse.json({ ok: true, updated: updates.length });
}
