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
            roleScopes: {
              where: {
                deletedAt: null,
              },
              include: {
                province: true,
                district: true,
              },
            },
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
        hasScopeRestriction: boolean;
        roleScopes?: Array<{
          provinceId?: string | null;
          districtId?: string | null;
        }>;
        permissions?: Array<{ permission: string }>;
      }> 
    };

    // Custom role isimlerini kontrol et
    const customRoleNames = userWithRoles.customRoles?.map((r) => r.name) || [];
    console.log('[MemberScopeService] User custom roles from DB:', customRoleNames);

    // MEMBER_LIST_BY_PROVINCE izni olan ve hasScopeRestriction true olan custom role'lerin scope'larını kontrol et
    // Önce districtId kontrolü (daha spesifik) - çoklu scope desteği
    const scopedRoles = userWithRoles.customRoles?.filter((role) => {
      const hasProvincePermission = role.permissions?.some(
        (p) => p.permission === 'MEMBER_LIST_BY_PROVINCE'
      );
      return hasProvincePermission && role.hasScopeRestriction && role.roleScopes && role.roleScopes.length > 0;
    }) || [];

    if (scopedRoles.length > 0) {
      // Tüm districtId'leri topla (çoklu scope desteği)
      const districtIds: string[] = [];
      const provinceIds: string[] = [];

      for (const role of scopedRoles) {
        if (role.roleScopes) {
          for (const scope of role.roleScopes) {
            if (scope.districtId) {
              districtIds.push(scope.districtId);
            } else if (scope.provinceId) {
              provinceIds.push(scope.provinceId);
            }
          }
        }
      }

      // DistrictId varsa önce onu kullan
      if (districtIds.length > 0) {
        console.log('[MemberScopeService] Filtering by role districtIds:', districtIds);
        return { districtId: { in: districtIds } };
      }

      // ProvinceId varsa onu kullan
      if (provinceIds.length > 0) {
        console.log('[MemberScopeService] Filtering by role provinceIds:', provinceIds);
        return { provinceId: { in: provinceIds } };
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
            roleScopes: {
              where: {
                deletedAt: null,
              },
              include: {
                province: true,
                district: true,
              },
            },
          },
        });

        if (role) {
          console.log('[MemberScopeService] Found role by name:', roleName);
          // MEMBER_LIST_BY_PROVINCE izni var mı kontrol et
          const hasProvincePermission = role.permissions?.some(
            (p) => p.permission === 'MEMBER_LIST_BY_PROVINCE'
          );
          
          if (hasProvincePermission && role.hasScopeRestriction && role.roleScopes && role.roleScopes.length > 0) {
            const districtIds = role.roleScopes
              .filter(s => s.districtId)
              .map(s => s.districtId)
              .filter((id): id is string => id !== null);
            
            const provinceIds = role.roleScopes
              .filter(s => s.provinceId && !s.districtId)
              .map(s => s.provinceId)
              .filter((id): id is string => id !== null);

            if (districtIds.length > 0) {
              console.log('[MemberScopeService] Filtering by role districtIds (from JWT role name):', districtIds);
              return { districtId: { in: districtIds } };
            }
            
            if (provinceIds.length > 0) {
              console.log('[MemberScopeService] Filtering by role provinceIds (from JWT role name):', provinceIds);
              return { provinceId: { in: provinceIds } };
            }
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

    // İlgili kullanıcı için tüm scope kayıtlarını bul (çoklu scope desteği)
    const scopes = await this.prisma.userScope.findMany({
      where: { 
        userId: user.userId,
        deletedAt: null, // Sadece soft delete edilmemiş scope'ları kullan
      },
    });

    if (!scopes || scopes.length === 0) {
      // Scope tanımlı değilse, şimdilik hiçbir üye göstermeyelim
      console.log('[MemberScopeService] No scope found for user:', user.userId);
      return { id: '' }; // impossible filter
    }

    console.log('[MemberScopeService] User scopes:', scopes.map(s => ({
      provinceId: s.provinceId,
      districtId: s.districtId,
    })));

    // IL_BASKANI → il bazlı (veritabanından gelen rol)
    if (customRoleNames.includes('IL_BASKANI')) {
      const provinceIds = scopes
        .filter(s => s.provinceId)
        .map(s => s.provinceId)
        .filter((id): id is string => id !== null);
      
      if (provinceIds.length > 0) {
        console.log('[MemberScopeService] Filtering by provinceIds:', provinceIds);
        return { provinceId: { in: provinceIds } };
      }
    }

    // ILCE_TEMSILCISI → ilçe bazlı (veritabanından gelen rol)
    if (customRoleNames.includes('ILCE_TEMSILCISI')) {
      const districtIds = scopes
        .filter(s => s.districtId)
        .map(s => s.districtId)
        .filter((id): id is string => id !== null);
      
      if (districtIds.length > 0) {
        console.log('[MemberScopeService] Filtering by districtIds:', districtIds);
        return { districtId: { in: districtIds } };
      }
    }

    // MEMBER_LIST_BY_PROVINCE izni varsa, tüm scope'ları OR mantığıyla birleştir
    const hasMemberListByProvince = userWithRoles.customRoles?.some(role =>
      role.permissions?.some(p => p.permission === 'MEMBER_LIST_BY_PROVINCE')
    );

    if (hasMemberListByProvince) {
      // Tüm scope'ları OR mantığıyla birleştir
      const orConditions: Prisma.MemberWhereInput[] = [];
      
      const districtIds = scopes
        .filter(s => s.districtId)
        .map(s => s.districtId)
        .filter((id): id is string => id !== null);
      
      const provinceIds = scopes
        .filter(s => s.provinceId && !s.districtId) // Sadece il bazlı olanlar (ilçe bazlı olanlar zaten districtIds'de)
        .map(s => s.provinceId)
        .filter((id): id is string => id !== null);

      if (districtIds.length > 0) {
        orConditions.push({ districtId: { in: districtIds } });
      }

      if (provinceIds.length > 0) {
        orConditions.push({ provinceId: { in: provinceIds } });
      }

      if (orConditions.length > 0) {
        console.log('[MemberScopeService] Filtering by multiple scopes with OR logic');
        return { OR: orConditions };
      }
    }

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
            roleScopes: {
              where: {
                deletedAt: null,
              },
            },
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
        hasScopeRestriction: boolean;
        roleScopes?: Array<{
          provinceId?: string | null;
          districtId?: string | null;
        }>;
        permissions?: Array<{ permission: string }>;
      }>;
    };

    // MEMBER_LIST_BY_PROVINCE izni olan ve hasScopeRestriction true olan custom role'lerin scope'larını kontrol et
    const scopedRoles = userWithRoles.customRoles?.filter((role) => {
      const hasProvincePermission = role.permissions?.some(
        (p) => p.permission === 'MEMBER_LIST_BY_PROVINCE'
      );
      return hasProvincePermission && role.hasScopeRestriction && role.roleScopes && role.roleScopes.length > 0;
    }) || [];

    if (scopedRoles.length > 0) {
      // İlk role'ün ilk scope'unu döndür (başvuru oluşturma için)
      const firstRole = scopedRoles[0];
      if (firstRole.roleScopes && firstRole.roleScopes.length > 0) {
        const firstScope = firstRole.roleScopes[0];
        if (firstScope.districtId) {
          return { provinceId: firstScope.provinceId || undefined, districtId: firstScope.districtId };
        }
        if (firstScope.provinceId) {
          return { provinceId: firstScope.provinceId };
        }
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
            roleScopes: {
              where: {
                deletedAt: null,
              },
            },
          },
        });

        if (role) {
          const hasProvincePermission = role.permissions?.some(
            (p) => p.permission === 'MEMBER_LIST_BY_PROVINCE'
          );
          
          if (hasProvincePermission && role.hasScopeRestriction && role.roleScopes && role.roleScopes.length > 0) {
            const firstScope = role.roleScopes[0];
            if (firstScope.districtId) {
              return { provinceId: firstScope.provinceId || undefined, districtId: firstScope.districtId };
            }
            if (firstScope.provinceId) {
              return { provinceId: firstScope.provinceId };
            }
          }
        }
      }
    }

    // UserScope'dan kontrol et (tüm scope'ları al)
    const scopes = await this.prisma.userScope.findMany({
      where: { 
        userId: user.userId,
        deletedAt: null, // Sadece soft delete edilmemiş scope'ları kullan
      },
    });

    if (scopes && scopes.length > 0) {
      // İlk scope'u döndür (geriye dönük uyumluluk için)
      // Not: Bu metod başvuru oluşturma için kullanılıyor, bu yüzden ilk scope'u döndürmek mantıklı
      const firstScope = scopes[0];
      if (firstScope.districtId) {
        return { provinceId: firstScope.provinceId || undefined, districtId: firstScope.districtId };
      }
      if (firstScope.provinceId) {
        return { provinceId: firstScope.provinceId };
      }
    }

    return {};
  }
}
