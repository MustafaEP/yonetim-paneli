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
    const userWithRoles = dbUser as User & { customRoles?: Array<{ name: string }> };

    // Custom role isimlerini kontrol et
    const customRoleNames = userWithRoles.customRoles?.map((r) => r.name) || [];
    console.log('[MemberScopeService] User custom roles from DB:', customRoleNames);

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
      workplaceId: scope.workplaceId,
      dealerId: scope.dealerId,
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

    // ISYERI_TEMSILCISI → işyeri bazlı (veritabanından gelen rol)
    if (customRoleNames.includes('ISYERI_TEMSILCISI') && scope.workplaceId) {
      console.log('[MemberScopeService] Filtering by workplaceId:', scope.workplaceId);
      return { workplaceId: scope.workplaceId };
    }

    // BAYI_YETKILISI → bayi bazlı (veritabanından gelen rol)
    if (customRoleNames.includes('BAYI_YETKILISI') && scope.dealerId) {
      console.log('[MemberScopeService] Filtering by dealerId:', scope.dealerId);
      return { dealerId: scope.dealerId };
    }

    // Diğer roller veya eksik scope: şimdilik hiç üye gösterme
    console.log('[MemberScopeService] No matching role/scope combination, returning impossible filter');
    return { id: '' };
  }
}
