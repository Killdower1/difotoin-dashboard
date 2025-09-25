import { readFile, readdir } from "fs/promises";
import path from "node:path";
export async function GET() {
  const root = process.cwd();
  const idx = path.join(root, "data", "periods", "index.json");
  try {
    const b = await readFile(idx, "utf8");
    const arr = JSON.parse(b);
    return Response.json(arr);
  } catch {
    // fallback: scan dirs
    try {
      const base = path.join(root, "data", "periods");
      const dirs = (await readdir(base, { withFileTypes: true })).filter(d=>d.isDirectory()).map(d=>d.name).sort();
      return Response.json(dirs);
    } catch { return Response.json([]); }
  }
}
