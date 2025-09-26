import type { NextApiRequest, NextApiResponse } from "next";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function openDB() {
  return open({
    filename: "./data/data.db",
    driver: sqlite3.Database,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = await openDB();

  if (req.method === "GET") {
    const rows = await db.all("SELECT key, value FROM thresholds");
    return res.status(200).json(rows);
  }

  if (req.method === "POST") {
    const { key, value } = req.body;
    if (!key || value === undefined) {
      return res.status(400).json({ error: "key & value required" });
    }
    await db.run("UPDATE thresholds SET value = ? WHERE key = ?", value, key);
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}
