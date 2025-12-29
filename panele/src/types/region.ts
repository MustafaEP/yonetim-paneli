// src/types/region.ts

export interface Province {
    id: string;
    name: string;
    code?: string | null;
  }
  
  export interface District {
    id: string;
    name: string;
    provinceId: string;
    province?: {
      id: string;
      name: string;
    } | null;
  }
  
// 🔹 Kullanıcı scope tipleri (GET /regions/user-scope/:userId)
export interface UserScope {
  id: string;
  province?: { id: string; name: string } | null;
  district?: { id: string; name: string } | null;
}

// 🔹 Institution
export interface Institution {
  id: string;
  name: string;
  provinceId: string;
  districtId?: string | null;
  kurumSicilNo?: string | null;
  gorevBirimi?: string | null;
  kurumAdresi?: string | null;
  kadroUnvanKodu?: string | null;
  isActive: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
  createdBy?: string | null;
  province?: {
    id: string;
    name: string;
    code?: string | null;
  } | null;
  district?: {
    id: string;
    name: string;
  } | null;
  memberCount?: number;
  createdAt?: string;
}
  
  