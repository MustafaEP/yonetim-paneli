import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parseCsvBuffer } from '../utils/csv-parser';
import {
  MEMBER_IMPORT_HEADER_ALIASES,
  MAX_IMPORT_FILE_BYTES,
  MAX_IMPORT_ROWS,
  PREVIEW_ROWS,
} from '../constants/member-import-schema';
import { Gender, EducationStatus } from '@prisma/client';

export type RowStatus = 'valid' | 'warning' | 'error';

export interface RowError {
  column?: string;
  message: string;
}

export interface PreviewRow {
  rowIndex: number;
  data: Record<string, string>;
  status: RowStatus;
  errors?: RowError[];
}

export interface ValidateMemberImportResult {
  totalRows: number;
  previewRows: PreviewRow[];
  errors: { rowIndex: number; column?: string; message: string }[];
  summary: { valid: number; warning: number; error: number };
}

/** İsimden id bulmak için normalize: trim, lowercase, Türkçe karakterleri düzelt */
function normalizeName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c');
}

/** CUID benzeri mi (c ile başlar, 25 karakter) */
function looksLikeId(value: string): boolean {
  return /^c[a-z0-9]{24}$/i.test((value || '').trim());
}

@Injectable()
export class MemberImportValidationService {
  private readonly logger = new Logger(MemberImportValidationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Türkçe Excel uyumlu CSV şablonu döndürür (noktalı virgül ayırıcı).
   * Örnek satır tüm alanlar dolu ve sistemdeki referanslarla (il/ilçe/kurum/şube vb.) doldurulur; doğrulama geçer ve kaydedilebilir.
   */
  async getTemplateCsv(): Promise<string> {
    const sep = ';';
    const headers =
      'Ad;Soyad;TC Kimlik No;Telefon;E-posta;Anne Adı;Baba Adı;Doğum Tarihi;Doğum Yeri;Cinsiyet;Öğrenim Durumu;İl;İlçe;Kurum;Şube;Tevkifat Merkezi;Tevkifat Ünvanı;Üye Grubu;Görev Birimi;Kurum Adresi;Kurum İli;Kurum İlçesi;Meslek;Kurum Sicil No;Kadro Unvan Kodu';

    const province = await this.prisma.province.findFirst({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    let district = province
      ? await this.prisma.district.findFirst({
          where: { provinceId: province.id },
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        })
      : null;
    if (!district) {
      district = await this.prisma.district.findFirst({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      });
    }
    let institution = district
      ? await this.prisma.institution.findFirst({
          where: { deletedAt: null, districtId: district!.id },
          orderBy: { name: 'asc' },
          select: { name: true },
        })
      : null;
    if (!institution) {
      institution = await this.prisma.institution.findFirst({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        select: { name: true },
      });
    }
    const [branch, tevkifatCenter, tevkifatTitle, memberGroup, profession] = await Promise.all([
      this.prisma.branch.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { name: true },
      }),
      this.prisma.tevkifatCenter.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { name: true },
      }),
      this.prisma.tevkifatTitle.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { name: true },
      }),
      this.prisma.memberGroup.findFirst({ orderBy: { name: 'asc' }, select: { name: true } }),
      this.prisma.profession.findFirst({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { name: true },
      }),
    ]);

    const provinceName = province?.name ?? 'İl';
    const districtName = district?.name ?? 'İlçe';
    const institutionName = institution?.name ?? 'Kurum';

    const exampleRow = [
      'Mehmet',
      'Demir',
      '12345678901',
      '05551234567',
      'mehmet@ornek.com',
      'Ayşe',
      'Ali',
      '1990-01-15',
      'İstanbul',
      'Erkek',
      'Üniversite',
      provinceName,
      districtName,
      institutionName,
      branch?.name ?? '',
      tevkifatCenter?.name ?? '',
      tevkifatTitle?.name ?? '',
      memberGroup?.name ?? '',
      'Acil Servis',
      'Örnek Mah. Test Sok. No:1',
      provinceName,
      districtName,
      profession?.name ?? '',
      '12345',
      'K001',
    ].join(sep);

    const csv = '\uFEFF' + headers + '\n' + exampleRow + '\n';
    return csv;
  }

  async validate(file: Express.Multer.File): Promise<ValidateMemberImportResult> {
    const buffer = file?.buffer ?? (file as unknown as { buffer?: Buffer })?.buffer;
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new BadRequestException('Dosya yüklenmedi veya geçersiz.');
    }
    if (buffer.length > MAX_IMPORT_FILE_BYTES) {
      throw new BadRequestException(
        `Dosya boyutu ${MAX_IMPORT_FILE_BYTES / 1024 / 1024} MB sınırını aşamaz.`,
      );
    }

    const { headers: rawHeaders, rows: rawRows } = parseCsvBuffer(buffer);
    if (rawHeaders.length === 0) {
      throw new BadRequestException('CSV dosyasında başlık satırı bulunamadı.');
    }

    const headerMap = this.normalizeHeaders(rawHeaders);
    const totalRows = rawRows.length;
    if (totalRows > MAX_IMPORT_ROWS) {
      throw new BadRequestException(
        `En fazla ${MAX_IMPORT_ROWS} satır yükleyebilirsiniz. Mevcut: ${totalRows}.`,
      );
    }

    const refs = await this.loadReferenceData();
    const previewRows: PreviewRow[] = [];
    const allErrors: { rowIndex: number; column?: string; message: string }[] = [];
    let valid = 0;
    let warning = 0;
    let error = 0;

    for (let i = 0; i < rawRows.length; i++) {
      const rowIndex = i + 2;
      const rawRow = rawRows[i];
      const data: Record<string, string> = {};
      rawHeaders.forEach((h, j) => {
        const key = headerMap[j] ?? `col_${j}`;
        data[key] = (rawRow[j] ?? '').trim();
      });

      const { status, errors: rowErrors } = this.validateRow(data, refs);
      if (status === 'valid') valid++;
      else if (status === 'warning') warning++;
      else error++;

      rowErrors.forEach((e) =>
        allErrors.push({
          rowIndex,
          column: e.column,
          message: e.message,
        }),
      );

      if (i < PREVIEW_ROWS) {
        previewRows.push({
          rowIndex,
          data,
          status,
          errors: rowErrors.length > 0 ? rowErrors : undefined,
        });
      }
    }

    return {
      totalRows,
      previewRows,
      errors: allErrors,
      summary: { valid, warning, error },
    };
  }

  private normalizeHeaders(rawHeaders: string[]): string[] {
    return rawHeaders.map((h) => {
      const trimmed = (h ?? '').trim();
      const alias = MEMBER_IMPORT_HEADER_ALIASES[trimmed];
      if (alias) return alias;
      if (trimmed.indexOf(' ') === -1 && /^[a-zA-Z]+$/.test(trimmed)) {
        const lower = trimmed.toLowerCase();
        const camel = lower.charAt(0) + lower.slice(1);
        return camel;
      }
      return trimmed || '';
    });
  }

  private async loadReferenceData() {
    const [provinces, districts, branches, institutions, professions, memberGroups, tevkifatCenters, tevkifatTitles] =
      await Promise.all([
        this.prisma.province.findMany({ select: { id: true, name: true } }),
        this.prisma.district.findMany({
          include: { province: { select: { name: true } } },
        }),
        this.prisma.branch.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        }),
        this.prisma.institution.findMany({
          where: { deletedAt: null },
          select: { id: true, name: true },
        }),
        this.prisma.profession.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        }),
        this.prisma.memberGroup.findMany({
          select: { id: true, name: true },
        }),
        this.prisma.tevkifatCenter.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        }),
        this.prisma.tevkifatTitle.findMany({
          where: { isActive: true },
          select: { id: true, name: true },
        }),
      ]);

    const provinceByName = new Map(provinces.map((p) => [normalizeName(p.name), p.id]));
    const districtByName = new Map<string, string>();
    districts.forEach((d) => {
      const key = normalizeName(d.name);
      const keyWithProvince = normalizeName(d.province.name) + '|' + key;
      districtByName.set(key, d.id);
      districtByName.set(keyWithProvince, d.id);
    });
    const branchByName = new Map(
      branches.map((b) => [normalizeName(b.name), b.id]),
    );
    const institutionByName = new Map(
      institutions.map((i) => [normalizeName(i.name), i.id]),
    );
    const professionByName = new Map(
      professions.map((p) => [normalizeName(p.name), p.id]),
    );
    const memberGroupByName = new Map(
      memberGroups.map((g) => [normalizeName(g.name), g.id]),
    );
    const tevkifatCenterByName = new Map(
      tevkifatCenters.map((c) => [normalizeName(c.name), c.id]),
    );
    const tevkifatTitleByName = new Map(
      tevkifatTitles.map((t) => [normalizeName(t.name), t.id]),
    );

    return {
      provinces: new Map(provinces.map((p) => [p.id, p])),
      districts: new Map(districts.map((d) => [d.id, d])),
      provinceByName,
      districtByName,
      branchByName,
      institutionByName,
      professionByName,
      memberGroupByName,
      tevkifatCenterByName,
      tevkifatTitleByName,
      branchIds: new Set(branches.map((b) => b.id)),
      institutionIds: new Set(institutions.map((i) => i.id)),
      provinceIds: new Set(provinces.map((p) => p.id)),
      districtIds: new Set(districts.map((d) => d.id)),
      professionIds: new Set(professions.map((p) => p.id)),
      memberGroupIds: new Set(memberGroups.map((g) => g.id)),
      tevkifatCenterIds: new Set(tevkifatCenters.map((c) => c.id)),
      tevkifatTitleIds: new Set(tevkifatTitles.map((t) => t.id)),
    };
  }

  private validateRow(
    data: Record<string, string>,
    refs: Awaited<ReturnType<MemberImportValidationService['loadReferenceData']>>,
  ): { status: RowStatus; errors: RowError[] } {
    const errors: RowError[] = [];

    const get = (key: string) => (data[key] ?? '').trim();

    const firstName = get('firstName');
    const lastName = get('lastName');
    const nationalId = get('nationalId');
    const phone = get('phone');
    const motherName = get('motherName');
    const fatherName = get('fatherName');
    const birthDate = get('birthDate');
    const birthplace = get('birthplace');
    const gender = get('gender');
    const educationStatus = get('educationStatus');
    const provinceId = get('provinceId');
    const districtId = get('districtId');
    const institutionId = get('institutionId');

    if (!firstName) errors.push({ column: 'firstName', message: 'Ad zorunludur.' });
    if (!lastName) errors.push({ column: 'lastName', message: 'Soyad zorunludur.' });
    if (!nationalId) {
      errors.push({ column: 'nationalId', message: 'TC Kimlik No zorunludur.' });
    } else if (!/^\d{11}$/.test(nationalId)) {
      errors.push({
        column: 'nationalId',
        message: 'TC Kimlik No 11 haneli rakam olmalıdır.',
      });
    }
    if (!phone) {
      errors.push({ column: 'phone', message: 'Telefon zorunludur.' });
    } else {
      const phoneNorm = phone.replace(/\s/g, '');
      if (!/^(\+90|0)?[0-9]{10}$/.test(phoneNorm)) {
        errors.push({
          column: 'phone',
          message: 'Geçerli bir telefon numarası giriniz.',
        });
      }
    }
    const email = get('email');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ column: 'email', message: 'Geçerli bir e-posta adresi giriniz.' });
    }
    if (!motherName) errors.push({ column: 'motherName', message: 'Anne adı zorunludur.' });
    if (!fatherName) errors.push({ column: 'fatherName', message: 'Baba adı zorunludur.' });
    if (!birthDate) {
      errors.push({ column: 'birthDate', message: 'Doğum tarihi zorunludur (YYYY-MM-DD).' });
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
      errors.push({
        column: 'birthDate',
        message: 'Doğum tarihi YYYY-MM-DD formatında olmalıdır.',
      });
    }
    if (!birthplace) errors.push({ column: 'birthplace', message: 'Doğum yeri zorunludur.' });
    if (!gender) {
      errors.push({ column: 'gender', message: 'Cinsiyet zorunludur (Erkek/Kadın/Diğer veya MALE/FEMALE/OTHER).' });
    } else {
      const g = this.normalizeGender(gender);
      if (!g) {
        errors.push({
          column: 'gender',
          message: 'Cinsiyet: Erkek, Kadın, Diğer veya MALE, FEMALE, OTHER olmalıdır.',
        });
      }
    }
    if (!educationStatus) {
      errors.push({
        column: 'educationStatus',
        message: 'Öğrenim durumu zorunludur (İlkokul/Lise/Üniversite veya PRIMARY/HIGH_SCHOOL/COLLEGE).',
      });
    } else {
      const e = this.normalizeEducation(educationStatus);
      if (!e) {
        errors.push({
          column: 'educationStatus',
          message: 'Öğrenim: İlkokul, Lise, Üniversite veya PRIMARY, HIGH_SCHOOL, COLLEGE olmalıdır.',
        });
      }
    }

    let resolvedProvinceId: string | null = null;
    if (provinceId) {
      if (looksLikeId(provinceId) && refs.provinceIds.has(provinceId)) {
        resolvedProvinceId = provinceId;
      } else {
        const found = refs.provinceByName.get(normalizeName(provinceId));
        if (found) resolvedProvinceId = found;
        else errors.push({ column: 'provinceId', message: `İl bulunamadı: ${provinceId}` });
      }
    } else {
      errors.push({ column: 'provinceId', message: 'İl zorunludur.' });
    }

    let resolvedDistrictId: string | null = null;
    if (districtId) {
      if (looksLikeId(districtId) && refs.districtIds.has(districtId)) {
        resolvedDistrictId = districtId;
      } else {
        const key = normalizeName(districtId);
        const keyWithProv = resolvedProvinceId
          ? normalizeName(refs.provinces.get(resolvedProvinceId)?.name ?? '') + '|' + key
          : key;
        const found = refs.districtByName.get(keyWithProv) ?? refs.districtByName.get(key);
        if (found) resolvedDistrictId = found;
        else errors.push({ column: 'districtId', message: `İlçe bulunamadı: ${districtId}` });
      }
    } else {
      errors.push({ column: 'districtId', message: 'İlçe zorunludur.' });
    }

    let resolvedInstitutionId: string | null = null;
    if (institutionId) {
      if (looksLikeId(institutionId) && refs.institutionIds.has(institutionId)) {
        resolvedInstitutionId = institutionId;
      } else {
        const found = refs.institutionByName.get(normalizeName(institutionId));
        if (found) resolvedInstitutionId = found;
        else errors.push({ column: 'institutionId', message: `Kurum bulunamadı: ${institutionId}` });
      }
    } else {
      errors.push({ column: 'institutionId', message: 'Kurum zorunludur.' });
    }

    const branchId = get('branchId');
    if (branchId) {
      if (looksLikeId(branchId)) {
        if (!refs.branchIds.has(branchId)) {
          errors.push({ column: 'branchId', message: `Şube bulunamadı: ${branchId}` });
        }
      } else {
        const found = refs.branchByName.get(normalizeName(branchId));
        if (!found) {
          errors.push({ column: 'branchId', message: `Şube bulunamadı: ${branchId}` });
        }
      }
    }

    const status: RowStatus = errors.length > 0 ? 'error' : 'valid';
    return { status, errors };
  }

  private normalizeGender(val: string): Gender | null {
    const v = val.trim().toLowerCase();
    if (['male', 'erkek', 'e'].includes(v)) return Gender.MALE;
    if (['female', 'kadın', 'kadin', 'k'].includes(v)) return Gender.FEMALE;
    if (['other', 'diğer', 'diger', 'd'].includes(v)) return Gender.OTHER;
    return null;
  }

  private normalizeEducation(val: string): EducationStatus | null {
    const v = val.trim().toLowerCase();
    if (['primary', 'ilkokul', 'ilk'].includes(v)) return EducationStatus.PRIMARY;
    if (['high_school', 'lise', 'l'].includes(v)) return EducationStatus.HIGH_SCHOOL;
    if (['college', 'üniversite', 'universite', 'yüksek', 'yuksek'].includes(v))
      return EducationStatus.COLLEGE;
    return null;
  }
}
