import { mkdir, writeFile } from "fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";

export async function POST(req:Request){
  try{
    const fd=await req.formData();
    const file=fd.get("file") as File | null;
    if(!file) return Response.json({error:"no file"},{status:400});
    const buf=Buffer.from(await file.arrayBuffer());
    const wb=XLSX.read(buf,{type:"buffer"});
    const ws=wb.Sheets[wb.SheetNames[0]];
    const rows:any[]=XLSX.utils.sheet_to_json(ws,{defval:""});
    const mapped=rows.map(r=>({
      alias: String(r.alias||r.Alias||"").trim(),
      master: String(r.master||r.Master||"").trim(),
    })).filter(r=>r.alias && r.master);
    const dir=path.join(process.cwd(),"data"); await mkdir(dir,{recursive:true});
    await writeFile(path.join(dir,"outlet_alias.json"), Buffer.from(JSON.stringify(mapped,null,2)));
    return Response.json({ok:true,count:mapped.length});
  }catch(e:any){
    return Response.json({error:e?.message||"import failed"},{status:500});
  }
}
