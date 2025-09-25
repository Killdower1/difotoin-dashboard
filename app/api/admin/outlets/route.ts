import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const p = path.join(process.cwd(), "data", "outlets_master.json");
    const buf = await readFile(p);
    return new Response(buf.toString("utf-8"), {
      headers: { "content-type": "application/json" },
    });
  } catch {
    return Response.json([]);
  }
}
