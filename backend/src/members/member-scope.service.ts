import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { CurrentUserData } from '../auth/current-user.decorator';

@Injectable()
export class MemberScopeService {
  constructor(private prisma: PrismaService) {}

  async buildMemberWhereForUser(
    user: CurrentUserData,
  ): Promise<Prisma.MemberWhereInput> {
    const roles = user.roles as Role[];

    // Süper kullanıcılar her şeyi görsün
    if (
      roles.includes(Role.ADMIN) ||
      roles.includes(Role.MODERATOR) ||
      roles.includes(Role.GENEL_BASKAN) ||
      roles.includes(Role.GENEL_BASKAN_YRD) ||
      roles.includes(Role.GENEL_SEKRETER)
    ) {
      return {}; // filtre yok → tüm üyeler
    }

    // İlgili kullanıcı için scope kaydı bul
    const scope = await this.prisma.userScope.findFirst({
      where: { userId: user.userId },
    });

    if (!scope) {
      // Scope tanımlı değilse, şimdilik hiçbir üye göstermeyelim
      return { id: '' }; // impossible filter
    }

    // IL_BASKANI → il bazlı
    if (roles.includes(Role.IL_BASKANI) && scope.provinceId) {
      return { provinceId: scope.provinceId };
    }

    // ILCE_TEMSILCISI → ilçe bazlı
    if (roles.includes(Role.ILCE_TEMSILCISI) && scope.districtId) {
      return { districtId: scope.districtId };
    }

    // ISYERI_TEMSILCISI → işyeri bazlı
    if (roles.includes(Role.ISYERI_TEMSILCISI) && scope.workplaceId) {
      return { workplaceId: scope.workplaceId };
    }

    // BAYI_YETKILISI → bayi bazlı
    if (roles.includes(Role.BAYI_YETKILISI) && scope.dealerId) {
      return { dealerId: scope.dealerId };
    }

    // Diğer roller veya eksik scope: şimdilik hiç üye gösterme
    return { id: '' };
  }
}
