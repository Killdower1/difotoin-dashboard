export type VenueParent = {
  id: string;         // id parent, disimpan di venueType/venueParent
  label: string;      // label parent yang tampil
  children: Array<{ id: string; label: string }>;  // id child disimpan di venueSubType
};

export const VENUE_PARENTS: VenueParent[] = [
  {
    id: "pusat-perbelanjaan-hiburan", label: "Pusat Perbelanjaan & Hiburan",
    children: [
      { id: "mall", label: "Mall" },
      { id: "supermarket-hypermarket", label: "Supermarket / Hypermarket" },
      { id: "pasar-tradisional", label: "Pasar Tradisional" },
      { id: "pusat-komunitas", label: "Pusat Komunitas" },
    ],
  },
  {
    id: "area-transportasi", label: "Area Transportasi",
    children: [
      { id: "stasiun", label: "Stasiun Kereta / MRT / LRT" },
      { id: "terminal-bus", label: "Terminal Bus" },
      { id: "bandara", label: "Bandara" },
    ],
  },
  {
    id: "area-edukasi", label: "Area Edukasi",
    children: [
      { id: "kampus-universitas", label: "Kampus / Universitas" },
      { id: "sekolah", label: "Sekolah (SMA/SMK)" },
    ],
  },
  {
    id: "area-kuliner-nongkrong", label: "Area Kuliner & Nongkrong",
    children: [
      { id: "cafe-resto", label: "Cafe / Resto" },
      { id: "food-court", label: "Food Court" },
    ],
  },
  {
    id: "area-wisata-event", label: "Area Wisata & Event",
    children: [
      { id: "wisata-theme-park", label: "Wisata / Theme Park" },
      { id: "taman-kota", label: "Taman Kota" },
      { id: "event-space", label: "Event Space / Gedung Pertunjukan" },
    ],
  },
  {
    id: "area-pelayanan-publik", label: "Area Pelayanan Publik",
    children: [
      { id: "rumah-sakit-klinik", label: "Rumah Sakit / Klinik" },
      { id: "tempat-ibadah-besar", label: "Tempat Ibadah Besar" },
      { id: "gedung-pemerintahan", label: "Gedung Pemerintahan" },
    ],
  },
  {
    id: "area-kantor-profesional", label: "Area Kantor & Profesional",
    children: [
      { id: "kawasan-perkantoran", label: "Kawasan Perkantoran" },
      { id: "coworking", label: "Co-working Space" },
    ],
  },
  {
    id: "area-outdoor-lainnya", label: "Area Outdoor Lainnya",
    children: [
      { id: "outdoor-lainnya", label: "Area Outdoor Lainnya" },
    ],
  },
];

// helper
export function parentById(id?: string | null) {
  if (!id) return null;
  const x = id.toString().trim().toLowerCase();
  return VENUE_PARENTS.find(p => p.id === x) || null;
}
export function childToParentId(childId?: string | null): string | null {
  if (!childId) return null;
  const c = childId.toString().trim().toLowerCase();
  for (const p of VENUE_PARENTS) {
    if (p.children.some(ch => ch.id === c)) return p.id;
  }
  return null;
}
export function labelOfParent(id?: string | null): string {
  const p = parentById(id);
  return p ? p.label : "";
}
