import { randomBytes, scryptSync, timingSafeEqual, createHmac } from "node:crypto";

function b64u(buf: Buffer){ return buf.toString("base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
function b64uJSON(obj:any){ return b64u(Buffer.from(JSON.stringify(obj))); }
function fromB64u(s:string){ s=s.replace(/-/g,"+").replace(/_/g,"/"); const pad = 4 - (s.length % 4 || 4); return Buffer.from(s + "=".repeat(pad), "base64"); }

export function getAuthSecret(){
  return process.env.AUTH_SECRET || "dev-secret-dont-use-in-prod";
}

export function hashPassword(password:string){
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return "scrypt:" + b64u(salt) + ":" + b64u(hash);
}

export function verifyPassword(password:string, stored:string){
  try{
    const parts = stored.split(":");
    if (parts[0] !== "scrypt") return false;
    const salt = fromB64u(parts[1]);
    const expect = fromB64u(parts[2]);
    const got = scryptSync(password, salt, 64);
    return timingSafeEqual(expect, got);
  }catch{ return false; }
}

export type JwtPayload = { sub:string; role:"admin"|"viewer"; exp:number };
export function signToken(p: JwtPayload){
  const header = { alg:"HS256", typ:"JWT" };
  const h = b64uJSON(header);
  const pl = b64uJSON(p);
  const data = h + "." + pl;
  const sig = createHmac("sha256", getAuthSecret()).update(data).digest();
  return data + "." + b64u(sig);
}

export function verifyToken(token:string): JwtPayload | null {
  try{
    const [h, pl, s] = token.split(".");
    if(!h || !pl || !s) return null;
    const data = h + "." + pl;
    const sig = createHmac("sha256", getAuthSecret()).update(data).digest();
    const ok = timingSafeEqual(sig, fromB64u(s));
    if(!ok) return null;
    const payload = JSON.parse(fromB64u(pl).toString("utf8"));
    if(!payload.exp || Date.now()/1000 > payload.exp) return null;
    return payload;
  }catch{ return null; }
}
