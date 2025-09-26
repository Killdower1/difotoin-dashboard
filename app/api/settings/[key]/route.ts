import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";

export async function PUT(req: Request, { params }: { params: { key: string } }) {
  const key = params.key;
  const body = (await req.json().catch(() => null)) as { value?: number } | null;
  const value = body?.value;

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }

  const updated = await prisma.setting.upsert({
    where: { key },
    update: { value: Math.trunc(value) },
    create: { key, value: Math.trunc(value) },
  });

  return NextResponse.json(updated);
}