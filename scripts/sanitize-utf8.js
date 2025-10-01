const fs = require("fs");
const path = require("path");
const globby = require("globby");

function decodeSmart(buf){
  if(buf[0]===0xFF && buf[1]===0xFE) return require("iconv-lite").decode(buf.slice(2),"utf16-le");
  if(buf[0]===0xFE && buf[1]===0xFF) return require("iconv-lite").decode(buf.slice(2),"utf16-be");
  try { new TextDecoder("utf-8",{fatal:true}).decode(buf); return buf.toString("utf8"); }
  catch { return require("iconv-lite").decode(buf,"utf8"); }
}

const MAP = new Map([
  ["â€”","—"],["â€“","–"],["â€˜","‘"],["â€™","’"],["â€œ","“"],["â€\x9d","”"],["â€","”"],["Â",""]
]);

(async()=>{
  const files = await globby([
    "app/**/*.{ts,tsx,js,jsx,md}",
    "components/**/*.{ts,tsx,js,jsx}",
    "lib/**/*.{ts,tsx,js,jsx}",
    "*.md","*.json"
  ], {gitignore:true});
  let fixed=0;
  for(const f of files){
    const raw=fs.readFileSync(f); let s=decodeSmart(raw);
    const before=s;
    for(const [bad,good] of MAP) s=s.split(bad).join(good);
    if(s!==before || String.fromCharCode(...raw.slice(0,2))!=="\u0000\u0000"){
      fs.writeFileSync(f, Buffer.from(s,"utf8")); fixed++;
    }
  }
  console.log("Sanitized files:", fixed, "of", files.length);
})();
