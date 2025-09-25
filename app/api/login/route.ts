import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (password && process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
    cookies().set("session", "1", { httpOnly: true, sameSite: "lax", secure: false, path: "/" });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }
  return new Response(JSON.stringify({ ok: false }), { status: 401 });
}
