import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MemberScopeService } from '../members/member-scope.service';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { MemberStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  // Varsayılan aylık aidat miktarı (TL) - Sistem ayarlarından alınabilir
  private readonly DEFAULT_MONTHLY_DUES = 50;

  constructor(
    private prisma: PrismaService,
    private memberScopeService: MemberScopeService,
  ) {}

  async getGlobalReport(user?: CurrentUserData) {
    const scopeIds = user ? await this.memberScopeService.getUserScopeIds(user) : {};

    const where: any = {};
    if (scopeIds.provinceId) {
      where.provinceId = scopeIds.provinceId;
    }
    if (scopeIds.districtId) {
      where.districtId = scopeIds.districtId;
    }

    const [
      totalMembers,
      activeMembers,
      cancelledMembers,
      totalUsers,
      totalRoles,
      totalPayments,
      byProvinceData,
      byStatusData,
    ] = await Promise.all([
      this.prisma.member.count({
        where: {
          ...where,
          status: { in: ['ACTIVE', 'RESIGNED', 'EXPELLED'] },
        },
      }),
      this.prisma.member.count({
        where: {
          ...where,
          status: 'ACTIVE',
        },
      }),
      this.prisma.member.count({
        where: {
          ...where,
          status: { in: ['RESIGNED', 'EXPELLED'] },
        },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          isActive: true,
        },
      }),
      this.prisma.customRole.count({
        where: {
          deletedAt: null,
          isActive: true,
        },
      }),
      this.prisma.memberPayment.aggregate({
        where: {
          member: where.provinceId || where.districtId ? where : undefined,
        },
        _sum: {
          amount: true,
        },
      }),
      this.prisma.member.groupBy({
        by: ['provinceId'],
        where: {
          ...where,
          status: { in: ['ACTIVE', 'RESIGNED', 'EXPELLED'] },
        },
        _count: {
          id: true,
        },
      }),
      this.prisma.member.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
      }),
    ]);

    // İl bazlı verileri formatla
    const byProvince = await Promise.all(
      byProvinceData.map(async (item) => {
        const province = await this.prisma.province.findUnique({
          where: { id: item.provinceId! },
        });
        return {
          provinceId: item.provinceId!,
          provinceName: province?.name || 'Bilinmeyen',
          memberCount: item._count.id,
        };
      }),
    );

    // Durum bazlı verileri formatla
    const byStatus = byStatusData.map((item) => ({
      status: item.status,
      count: item._count.id,
    }));

    // Borç hesaplama
    const totalDebt = await this.calculateTotalDebt(where);

    return {
      totalMembers,
      activeMembers,
      cancelledMembers,
      totalUsers,
      totalRoles,
      totalDuesPlans: 0, // DuesPlan modeli yok
      totalPayments: Number(totalPayments._sum.amount || 0),
      totalDebt,
      byProvince,
      byStatus,
    };
  }

  async getRegionReport(regionId?: string, user?: CurrentUserData) {
    const scopeIds = user ? await this.memberScopeService.getUserScopeIds(user) : {};

    // Eğer regionId verilmişse, sadece o bölge için rapor döndür
    if (regionId) {
      // Kullanıcı scope kontrolü
      if (scopeIds.provinceId && scopeIds.provinceId !== regionId) {
        throw new Error('Bu bölgeye erişim yetkiniz yok');
      }

      const province = await this.prisma.province.findUnique({
        where: { id: regionId },
      });

      if (!province) {
        throw new Error('Bölge bulunamadı');
      }

      const [
        memberCount,
        activeMembers,
        cancelledMembers,
        totalPayments,
      ] = await Promise.all([
        this.prisma.member.count({
          where: {
            provinceId: regionId,
            status: { in: ['ACTIVE', 'RESIGNED', 'EXPELLED'] },
          },
        }),
        this.prisma.member.count({
          where: {
            provinceId: regionId,
            status: 'ACTIVE',
          },
        }),
        this.prisma.member.count({
          where: {
            provinceId: regionId,
            status: { in: ['RESIGNED', 'EXPELLED'] },
          },
        }),
        this.prisma.memberPayment.aggregate({
          where: {
            member: {
              provinceId: regionId,
            },
          },
          _sum: {
            amount: true,
          },
        }),
      ]);

      return {
        regionId: province.id,
        regionName: province.name,
        memberCount,
        activeMembers,
        cancelledMembers,
        totalPayments: Number(totalPayments._sum.amount || 0),
        totalDebt: await this.calculateTotalDebt({ provinceId: regionId }),
      };
    }

    // Tüm bölgeler için rapor döndür
    const provinces = await this.prisma.province.findMany({
      orderBy: { name: 'asc' },
      where: scopeIds.provinceId ? { id: scopeIds.provinceId } : undefined,
    });

    const regionReports = await Promise.all(
      provinces.map(async (province) => {
        const [
          memberCount,
          activeMembers,
          cancelledMembers,
          totalPayments,
        ] = await Promise.all([
          this.prisma.member.count({
            where: {
              provinceId: province.id,
              status: { in: ['ACTIVE', 'RESIGNED', 'EXPELLED'] },
            },
          }),
          this.prisma.member.count({
            where: {
              provinceId: province.id,
              status: 'ACTIVE',
            },
          }),
          this.prisma.member.count({
            where: {
              provinceId: province.id,
              status: { in: ['RESIGNED', 'EXPELLED'] },
            },
          }),
          this.prisma.memberPayment.aggregate({
            where: {
              member: {
                provinceId: province.id,
              },
            },
            _sum: {
              amount: true,
            },
          }),
        ]);

        return {
          regionId: province.id,
          regionName: province.name,
          memberCount,
          activeMembers,
          cancelledMembers,
          totalPayments: Number(totalPayments._sum.amount || 0),
          totalDebt: await this.calculateTotalDebt({ provinceId: province.id }),
        };
      }),
    );

    return regionReports;
  }

  async getMemberStatusReport(user?: CurrentUserData) {
    const scopeIds = user ? await this.memberScopeService.getUserScopeIds(user) : {};

    const where: any = {};
    if (scopeIds.provinceId) {
      where.provinceId = scopeIds.provinceId;
    }
    if (scopeIds.districtId) {
      where.districtId = scopeIds.districtId;
    }

    const [statusCounts, totalMembers] = await Promise.all([
      this.prisma.member.groupBy({
        by: ['status'],
        where,
        _count: {
          id: true,
        },
      }),
      this.prisma.member.count({ where }),
    ]);

    return statusCounts.map((item) => ({
      status: item.status,
      count: item._count.id,
      percentage: totalMembers > 0 ? (item._count.id / totalMembers) * 100 : 0,
      members: [], // TODO: Üye listesi eklenebilir
    }));
  }

  async getDuesReport(user?: CurrentUserData, params?: { year?: number; month?: number }) {
    const scopeIds = user ? await this.memberScopeService.getUserScopeIds(user) : {};

    const where: any = {};
    if (scopeIds.provinceId) {
      where.member = { provinceId: scopeIds.provinceId };
    }
    if (scopeIds.districtId) {
      where.member = { ...where.member, districtId: scopeIds.districtId };
    }

    // Tarih filtresi
    if (params?.year) {
      where.paymentPeriodYear = params.year;
    }
    if (params?.month) {
      where.paymentPeriodMonth = params.month;
    }

    // Toplam ödemeler
    const totalPaymentsResult = await this.prisma.memberPayment.aggregate({
      where,
      _sum: {
        amount: true,
      },
    });

    // Ödeme yapan ve yapmayan üye sayıları
    const memberWhere: any = {};
    if (scopeIds.provinceId) {
      memberWhere.provinceId = scopeIds.provinceId;
    }
    if (scopeIds.districtId) {
      memberWhere.districtId = scopeIds.districtId;
    }

    const [paidMembers, unpaidMembers] = await Promise.all([
      this.prisma.member.count({
        where: {
          ...memberWhere,
          status: 'ACTIVE',
          payments: {
            some: {},
          },
        },
      }),
      this.prisma.member.count({
        where: {
          ...memberWhere,
          status: 'ACTIVE',
          payments: {
            none: {},
          },
        },
      }),
    ]);

    // Aylık ödemeler
    const byMonthData = await this.prisma.memberPayment.groupBy({
      by: ['paymentPeriodYear', 'paymentPeriodMonth'],
      where,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      orderBy: [
        { paymentPeriodYear: 'desc' },
        { paymentPeriodMonth: 'desc' },
      ],
    });

    const byMonth = byMonthData.map((item) => ({
      year: item.paymentPeriodYear,
      month: item.paymentPeriodMonth,
      total: Number(item._sum.amount || 0),
      count: item._count.id,
    }));

    // Plan bazlı ödemeler (DuesPlan modeli yok, bu yüzden boş array döndürüyoruz)
    const byPlan: Array<{
      planId: string;
      planName: string;
      totalPayments: number;
      memberCount: number;
    }> = [];

    // Borç hesaplama
    const memberWhereForDebt: any = {};
    if (scopeIds.provinceId) {
      memberWhereForDebt.provinceId = scopeIds.provinceId;
    }
    if (scopeIds.districtId) {
      memberWhereForDebt.districtId = scopeIds.districtId;
    }
    const totalDebt = await this.calculateTotalDebt(memberWhereForDebt, params?.year, params?.month);

    return {
      totalPayments: Number(totalPaymentsResult._sum.amount || 0),
      totalDebt,
      paidMembers,
      unpaidMembers,
      byMonth,
      byPlan,
    };
  }

  /**
   * Toplam borç hesapla
   */
  private async calculateTotalDebt(
    memberWhere: any = {},
    targetYear?: number,
    targetMonth?: number,
  ): Promise<number> {
    const now = new Date();
    const currentYear = targetYear || now.getFullYear();
    const currentMonth = targetMonth || now.getMonth() + 1;

    // Aktif üyeleri al
    const activeMembers = await this.prisma.member.findMany({
      where: {
        ...memberWhere,
        status: MemberStatus.ACTIVE,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        approvedAt: true,
        createdAt: true,
      },
    });

    let totalDebt = 0;

    for (const member of activeMembers) {
      const memberDebt = await this.calculateMemberDebt(member.id, currentYear, currentMonth);
      totalDebt += memberDebt;
    }

    return totalDebt;
  }

  /**
   * Üye bazlı borç hesapla
   * Son 12 ay içinde ödeme yapılmamış aylar için borç hesaplar
   */
  async calculateMemberDebt(memberId: string, targetYear?: number, targetMonth?: number): Promise<number> {
    const now = new Date();
    const currentYear = targetYear || now.getFullYear();
    const currentMonth = targetMonth || now.getMonth() + 1;

    // Üyenin onay tarihini al (üyelik başlangıcı)
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        approvedAt: true,
        createdAt: true,
        status: true,
      },
    });

    if (!member || member.status !== MemberStatus.ACTIVE) {
      return 0;
    }

    // Üyelik başlangıç tarihi
    const membershipStartDate = member.approvedAt
      ? new Date(member.approvedAt)
      : new Date(member.createdAt);
    const membershipStartYear = membershipStartDate.getFullYear();
    const membershipStartMonth = membershipStartDate.getMonth() + 1;

    // Son 12 ay içindeki ödemeleri al
    const payments = await this.prisma.memberPayment.findMany({
      where: {
        memberId,
        isApproved: true,
        paymentPeriodYear: {
          gte: currentYear - 1,
        },
      },
      select: {
        paymentPeriodYear: true,
        paymentPeriodMonth: true,
      },
    });

    // Ödenmiş ayları set olarak tut
    const paidMonths = new Set<string>();
    payments.forEach((p) => {
      paidMonths.add(`${p.paymentPeriodYear}-${p.paymentPeriodMonth}`);
    });

    // Borç hesapla: Son 12 ay içinde ödenmemiş aylar
    let debtMonths = 0;
    const monthsToCheck = 12;

    for (let i = 0; i < monthsToCheck; i++) {
      let checkYear = currentYear;
      let checkMonth = currentMonth - i;

      // Ay negatif olursa önceki yıla geç
      while (checkMonth <= 0) {
        checkMonth += 12;
        checkYear -= 1;
      }

      // Üyelik başlangıcından önceki ayları sayma
      if (checkYear < membershipStartYear || (checkYear === membershipStartYear && checkMonth < membershipStartMonth)) {
        continue;
      }

      // Ödenmemiş ay kontrolü
      const monthKey = `${checkYear}-${checkMonth}`;
      if (!paidMonths.has(monthKey)) {
        debtMonths++;
      }
    }

    return debtMonths * this.DEFAULT_MONTHLY_DUES;
  }
}

