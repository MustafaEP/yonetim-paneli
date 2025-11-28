export type MemberStatus = "BEKLEME" | "AKTİF" | "İSTİFA";
export type Gender = "ERKEK" | "KADIN";
export type EducationStatus = "İLKÖĞRETİM" | "LİSE" | "YÜKSEKOKUL";

export interface Member {
  id: number;
  status: MemberStatus;
  registrationNo?: string | null;
  nationalId?: string | null;
  firstName: string;
  lastName: string;
  province?: string | null;
  district?: string | null;
  institution?: string | null;
  motherName?: string | null;
  fatherName?: string | null;
  birthPlace?: string | null;
  gender?: Gender | null;
  educationStatus?: EducationStatus | null;
  phoneNumber?: string | null;
  registrationDate?: string | null;
  ledgerNo?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberListResponse {
  items: Member[];
  total: number;
  page: number;
  limit: number;
}
