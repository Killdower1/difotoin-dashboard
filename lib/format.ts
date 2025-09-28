// lib/format.ts — konsistensi format angka (hindari hydration mismatch "1.200" vs "1,200")
export const nfID = new Intl.NumberFormat('id-ID');
export function fmt(n: number | string) {
  const x = typeof n === 'string' ? Number(n) : n;
  if (!isFinite(x as number)) return '0';
  return nfID.format(x as number);
}
export function percent(v: number, digits = 1) {
  if (!isFinite(v)) v = 0;
  return (v/100).toLocaleString('id-ID', { style: 'percent', maximumFractionDigits: digits });
}
