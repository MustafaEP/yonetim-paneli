import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Injectable()
export class MemberScopeService {
  constructor(private prisma: PrismaService) {}

  async buildMemberWhereForUser(
    user: CurrentUserData,
  ): Promise<Prisma.MemberWhereInput> {
    // Önce JWT'den gelen rolleri kontrol et (fallback olarak)
    const jwtRoles = user.roles || [];
    console.log('[MemberScopeService] JWT roles:', jwtRoles);

    // ADMIN her şeyi görsün (JWT'den gelen rol bilgisini kullan)
    if (jwtRoles.includes('ADMIN')) {
      console.log('[MemberScopeService] User is ADMIN (from JWT), returning empty filter');
      return {}; // filtre yok → tüm üyeler
    }

    // Süper kullanıcı rolleri (JWT'den gelen rol bilgisini kullan)
    if (
      jwtRoles.includes('MODERATOR') ||
      jwtRoles.includes('GENEL_BASKAN') ||
      jwtRoles.includes('GENEL_BASKAN_YRD') ||
      jwtRoles.includes('GENEL_SEKRETER')
    ) {
      console.log('[MemberScopeService] User has super role (from JWT), returning empty filter');
      return {}; // filtre yok → tüm üyeler
    }

    // Kullanıcının custom rolleri ve scope'u kontrol et
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        customRoles: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: {
            permissions: true,
            province: true,
            district: true,
          },
        },
      },
    });

    if (!dbUser) {
      console.log('[MemberScopeService] User not found in DB:', user.userId);
      // Kullanıcı bulunamadı ama JWT'de rol var - zaten yukarıda kontrol ettik
      // Eğer süper rol yoksa, scope olmadan üye gösteremeyiz
      return { id: '' }; // impossible filter
    }

    // Type assertion for customRoles
    const userWithRoles = dbUser as User & { 
      customRoles?: Array<{ 
        name: string; 
        provinceId?: string | null;
        districtId?: string | null;
        permissions?: Array<{ permission: string }>;
      }> 
    };

    // Custom role isimlerini kontrol et
    const customRoleNames = userWithRoles.customRoles?.map((r) => r.name) || [];
    console.log('[MemberScopeService] User custom roles from DB:', customRoleNames);

    // MEMBER_LIST_BY_PROVINCE izni olan custom role'lerin districtId veya provinceId'sini kontrol et
    // Önce districtId kontrolü (daha spesifik)
    const districtScopedRoles = userWithRoles.customRoles?.filter((role) => {
      const hasProvincePermission = role.permissions?.some(
        (p) => p.permission === 'MEMBER_LIST_BY_PROVINCE'
      );
      return hasProvincePermission && role.districtId;
    }) || [];

    if (districtScopedRoles.length > 0) {
      // İlk role'ün districtId'sini kullan (birden fazla olursa ilkini al)
      const districtId = districtScopedRoles[0].districtId;
      if (districtId) {
        console.log('[MemberScopeService] Filtering by role districtId:', districtId);
        return { districtId };
      }
    }

    // Eğer districtId yoksa provinceId kontrolü
    const provinceScopedRoles = userWithRoles.customRoles?.filter((role) => {
      const hasProvincePermission = role.permissions?.some(
        (p) => p.permission === 'MEMBER_LIST_BY_PROVINCE'
      );
      return hasProvincePermission && role.provinceId && !role.districtId;
    }) || [];

    if (provinceScopedRoles.length > 0) {
      // İlk role'ün provinceId'sini kullan (birden fazla olursa ilkini al)
      const provinceId = provinceScopedRoles[0].provinceId;
      if (provinceId) {
        console.log('[MemberScopeService] Filtering by role provinceId:', provinceId);
        return { provinceId };
      }
    }

    // Eğer custom role'ler boş geliyorsa ama JWT'de rol varsa, JWT'deki rol adına göre role'ü çek
    if (customRoleNames.length === 0 && jwtRoles.length > 0) {
      console.log('[MemberScopeService] Custom roles empty, trying to fetch by JWT role names:', jwtRoles);
      for (const roleName of jwtRoles) {
        const role = await this.prisma.customRole.findFirst({
          where: {
            name: roleName,
            deletedAt: null,
            isActive: true,
          },
          include: {
            permissions: true,
            province: true,
            district: true,
          },
        });

        if (role) {
          console.log('[MemberScopeService] Found role by name:', roleName, 'provinceId:', role.provinceId);
          // MEMBER_LIST_BY_PROVINCE izni var mı kontrol et
          const hasProvincePermission = role.permissions?.some(
            (p) => p.permission === 'MEMBER_LIST_BY_PROVINCE'
          );
          if (hasProvincePermission && role.provinceId) {
            console.log('[MemberScopeService] Filtering by role provinceId (from JWT role name):', role.provinceId);
            return { provinceId: role.provinceId };
          }
        }
      }
    }

    // ADMIN her şeyi görsün (veritabanından gelen rol bilgisini kullan)
    if (customRoleNames.includes('ADMIN')) {
      console.log('[MemberScopeService] User is ADMIN (from DB), returning empty filter');
      return {}; // filtre yok → tüm üyeler
    }

    // Süper kullanıcı rolleri (veritabanından gelen)
    if (
      customRoleNames.includes('MODERATOR') ||
      customRoleNames.includes('GENEL_BASKAN') ||
      customRoleNames.includes('GENEL_BASKAN_YRD') ||
      customRoleNames.includes('GENEL_SEKRETER')
    ) {
      console.log('[MemberScopeService] User has super role (from DB), returning empty filter');
      return {}; // filtre yok → tüm üyeler
    }

    // İlgili kullanıcı için scope kaydı bul
    const scope = await this.prisma.userScope.findFirst({
      where: { userId: user.userId },
    });

    if (!scope) {
      // Scope tanımlı değilse, şimdilik hiçbir üye göstermeyelim
      console.log('[MemberScopeService] No scope found for user:', user.userId);
      return { id: '' }; // impossible filter
    }

    console.log('[MemberScopeService] User scope:', {
      provinceId: scope.provinceId,
      districtId: scope.districtId,
    });

    // IL_BASKANI → il bazlı (veritabanından gelen rol)
    if (customRoleNames.includes('IL_BASKANI') && scope.provinceId) {
      console.log('[MemberScopeService] Filtering by provinceId:', scope.provinceId);
      return { provinceId: scope.provinceId };
    }

    // ILCE_TEMSILCISI → ilçe bazlı (veritabanından gelen rol)
    if (customRoleNames.includes('ILCE_TEMSILCISI') && scope.districtId) {
      console.log('[MemberScopeService] Filtering by districtId:', scope.districtId);
      return { districtId: scope.districtId };
    }

    // Not: ISYERI_TEMSILCISI ve BAYI_YETKILISI rolleri için Member modelinde 
    // workplaceId ve dealerId artık yok. İşyeri/bayi bazlı filtreleme için
    // başka bir mekanizma gerekirse implement edilebilir (örn: institution bazlı)

    // Diğer roller veya eksik scope: şimdilik hiç üye gösterme
    console.log('[MemberScopeService] No matching role/scope combination, returning impossible filter');
    return { id: '' };
  }

  // Kullanıcının provinceId ve districtId'sini döndür (başvuru oluşturma için)
  async getUserScopeIds(user: CurrentUserData): Promise<{ provinceId?: string; districtId?: string }> {
    // Önce JWT'den gelen rolleri kontrol et
    const jwtRoles = user.roles || [];

    // ADMIN ve süper kullanıcılar için boş döndür (her yerde başvuru yapabilirler)
    if (
      jwtRoles.includes('ADMIN') ||
      jwtRoles.includes('MODERATOR') ||
      jwtRoles.includes('GENEL_BASKAN') ||
      jwtRoles.includes('GENEL_BASKAN_YRD') ||
      jwtRoles.includes('GENEL_SEKRETER')
    ) {
      return {};
    }

    // Kullanıcının custom rolleri ve scope'u kontrol et
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.userId },
      include: {
        customRoles: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: {
            permissions: true,
            province: true,
            district: true,
          },
        },
      },
    });

    if (!dbUser) {
      return {};
    }

    const userWithRoles = dbUser as User & {
      customRoles?: Array<{
        name: string;
        provinceId?: string | null;
        districtId?: string | null;
        permissions?: Array<{ permission: string }>;
      }>;
    };

    // MEMBER_LIST_BY_PROVINCE izni olan custom role'lerin districtId veya provinceId'sini kontrol et
    // Önce districtId kontrolü (daha spesifik)
    const districtScopedRoles = userWithRoles.customRoles?.filter((role) => {
      const hasProvincePermission = role.permissions?.some(
        (p) => p.permission === 'MEMBER_LIST_BY_PROVINCE'
      );
      return hasProvincePermission && role.districtId;
    }) || [];

    if (districtScopedRoles.length > 0) {
      const districtId = districtScopedRoles[0].districtId;
      const provinceId = districtScopedRoles[0].provinceId;
      if (districtId) {
        return { provinceId: provinceId || undefined, districtId };
      }
    }

    // Eğer districtId yoksa provinceId kontrolü
    const provinceScopedRoles = userWithRoles.customRoles?.filter((role) => {
      const hasProvincePermission = role.permissions?.some(
        (p) => p.permission === 'MEMBER_LIST_BY_PROVINCE'
      );
      return hasProvincePermission && role.provinceId && !role.districtId;
    }) || [];

    if (provinceScopedRoles.length > 0) {
      const provinceId = provinceScopedRoles[0].provinceId;
      if (provinceId) {
        return { provinceId };
      }
    }

    // Eğer custom role'ler boş geliyorsa ama JWT'de rol varsa, JWT'deki rol adına göre role'ü çek
    if (userWithRoles.customRoles?.length === 0 && jwtRoles.length > 0) {
      for (const roleName of jwtRoles) {
        const role = await this.prisma.customRole.findFirst({
          where: {
            name: roleName,
            deletedAt: null,
            isActive: true,
          },
          include: {
            permissions: true,
            province: true,
            district: true,
          },
        });

        if (role) {
          const hasProvincePermission = role.permissions?.some(
            (p) => p.permission === 'MEMBER_LIST_BY_PROVINCE'
          );
          if (hasProvincePermission && role.districtId) {
            return { provinceId: role.provinceId || undefined, districtId: role.districtId };
          }
          if (hasProvincePermission && role.provinceId) {
            return { provinceId: role.provinceId };
          }
        }
      }
    }

    // UserScope'dan kontrol et
    const scope = await this.prisma.userScope.findFirst({
      where: { userId: user.userId },
    });

    if (scope) {
      if (scope.districtId) {
        return { provinceId: scope.provinceId || undefined, districtId: scope.districtId };
      }
      if (scope.provinceId) {
        return { provinceId: scope.provinceId };
      }
    }

    return {};
  }
}
