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
      name: String(r.name||r.Name||r.Nama||"").trim(),
      floor_or_zone: String(r.floor_or_zone||r.zone||"").trim(),
      nearby_anchor: String(r.nearby_anchor||"").trim(),
      nearby_feature: String(r.nearby_feature||"").trim(),
      signage_available: String(r.signage_available||"").trim(),
      los_1to5: Number(r.los_1to5||r.LOS||0),
      power_1to5: Number(r.power_1to5||0),
      permit_1to5: Number(r.permit_1to5||0),
      notes: String(r.notes||"").trim(),
    })).filter(r=>r.name);
    const dir=path.join(process.cwd(),"data"); await mkdir(dir,{recursive:true});
    await writeFile(path.join(dir,"location_details.json"), Buffer.from(JSON.stringify(mapped,null,2)));
    return Response.json({ok:true,count:mapped.length});
  }catch(e:any){
    return Response.json({error:e?.message||"import failed"},{status:500});
  }
}
