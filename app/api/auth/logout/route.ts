import { NextRequest, NextResponse } from "next/server";
import { isSecureRequest } from "@/lib/secure-cookie";

export async function POST(req: NextRequest){
  const res = NextResponse.json({ ok:true });
  res.cookies.set("session","", { httpOnly:true, sameSite:"lax", secure:isSecureRequest(req), path:"/", maxAge:0 });
  return res;
}
