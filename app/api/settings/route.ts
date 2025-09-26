import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const rows = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json(rows);
}