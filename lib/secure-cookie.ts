import { NextRequest } from "next/server";

export function isSecureRequest(req: NextRequest | Request) {
  const proto = req.headers.get("x-forwarded-proto") || new URL(req.url).protocol.replace(":", "");
  return proto.split(",")[0]?.trim() === "https";
}
