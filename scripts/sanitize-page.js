const fs = require("fs");
const path = "app/dashboard/page.tsx";

function decodeSmart(buf) {
  // UTF-16 LE BOM
  if (buf.length >= 2 && buf[0] === 0xFF && buf[1] === 0xFE) {
    return require("iconv-lite").decode(buf.slice(2), "utf16-le");
  }
  // UTF-16 BE BOM
  if (buf.length >= 2 && buf[0] === 0xFE && buf[1] === 0xFF) {
    return require("iconv-lite").decode(buf.slice(2), "utf16-be");
  }
  // Try strict UTF-8 first
  try { new TextDecoder("utf-8", { fatal: true }).decode(buf); return buf.toString("utf8"); }
  catch { return require("iconv-lite").decode(buf, "utf8"); }
}

(function main() {
  const backup = path + ".bak";
  if (!fs.existsSync(backup)) fs.copyFileSync(path, backup);

  const raw = fs.readFileSync(path);
  let text = decodeSmart(raw);

  // Pastikan tidak ada className di <SelectContent ...>
  text = text
    .replace(/<SelectContent\s+className="([^"]*)">/g, '<div className="$1"><SelectContent>')
    .replace(/<\/SelectContent>/g, '</SelectContent></div>');

  // Tulis ulang UTF-8 TANPA BOM
  fs.writeFileSync(path, Buffer.from(text, "utf8"));
  console.log("Sanitized & patched:", path);
})();
