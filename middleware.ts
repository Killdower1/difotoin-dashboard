import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/admin/users/bootstrap",        // page
  "/api/admin/users/bootstrap",    // API bootstrap (allow without login)
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/need-bootstrap"       // public check
];

function isPublic(pathname:string){
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) return true;
  return PUBLIC_PATHS.includes(pathname);
}

function needAuth(pathname:string){
  return pathname.startsWith("/admin") ||
         pathname.startsWith("/dashboard") ||
         pathname.startsWith("/api/admin") ||
         pathname.startsWith("/api/metrics");
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  if (needAuth(pathname)) {
    const has = req.cookies.get("session");
    if (!has) {
      const url = new URL("/login", req.url);
      if (pathname && pathname !== "/") url.searchParams.set("redirect", pathname + (search||""));
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api/auth|static).*)"] };
