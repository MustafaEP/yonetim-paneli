import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDuesPlanDto,
  UpdateDuesPlanDto,
  CreateDuesPaymentDto,
} from './dto';
import { MemberScopeService } from '../members/member-scope.service';
import { CurrentUserData } from '../auth/current-user.decorator';
import { Prisma } from '@prisma/client';

@Injectable()
export class DuesService {
  constructor(
    private prisma: PrismaService,
    private scopeService: MemberScopeService,
  ) {}

  // ---------- PLANLAR ----------

  async listPlans(includeInactive = false) {
    return this.prisma.duesPlan.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlan(dto: CreateDuesPlanDto) {
    return this.prisma.duesPlan.create({
      data: {
        name: dto.name,
        description: dto.description,
        amount: new Prisma.Decimal(dto.amount),
        period: dto.period,
      },
    });
  }

  async updatePlan(id: string, dto: UpdateDuesPlanDto) {
    const data: any = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.period !== undefined) data.period = dto.period;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return this.prisma.duesPlan.update({
      where: { id },
      data,
    });
  }

  async softDeletePlan(id: string) {
    // Soft delete middleware handle edecek
    return this.prisma.duesPlan.delete({
      where: { id },
    });
  }

  // ---------- ÖDEMELER ----------

  async createPayment(dto: CreateDuesPaymentDto, user: CurrentUserData) {
    // İstersen burada member scope kontrolü de yapabilirsin (ör: sadece kendi ilindeki üyeye ödeme kaydı)

    return this.prisma.duesPayment.create({
      data: {
        memberId: dto.memberId,
        planId: dto.planId,
        amount: new Prisma.Decimal(dto.amount),
        periodYear: dto.periodYear,
        periodMonth: dto.periodMonth,
        note: dto.note,
        createdByUserId: user.userId,
      },
    });
  }

  // Belirli bir üyenin ödeme geçmişi
  async getPaymentsForMember(
    memberId: string,
    user: CurrentUserData,
  ) {
    // scope kontrolü: bu kullanıcı bu üyeyi görebiliyor mu?
    const memberWhere = await this.scopeService.buildMemberWhereForUser(user);

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, ...memberWhere },
    });

    if (!member) {
      // yetkisiz veya yok → boş liste dönelim (ya da ForbiddenException fırlatılabilir)
      return [];
    }

    return this.prisma.duesPayment.findMany({
      where: { memberId },
      orderBy: { paidAt: 'desc' },
    });
  }

  // Özet: scope'a göre tüm ödemeler (rapor)
  async getPaymentsSummary(user: CurrentUserData) {
    const memberWhere = await this.scopeService.buildMemberWhereForUser(user);

    const payments = await this.prisma.duesPayment.findMany({
      where: {
        member: {
          ...memberWhere,
        },
      },
      include: {
        member: true,
      },
      orderBy: { paidAt: 'desc' },
    });

    // Basit özet: kişi bazlı toplam ödenen
    const summary: Record<
      string,
      {
        memberId: string;
        memberName: string;
        totalAmount: number;
        paymentsCount: number;
      }
    > = {};

    payments.forEach((p) => {
      const key = p.memberId;
      const amountNum = Number(p.amount);

      if (!summary[key]) {
        summary[key] = {
          memberId: p.memberId,
          memberName: `${p.member.firstName} ${p.member.lastName}`,
          totalAmount: 0,
          paymentsCount: 0,
        };
      }

      summary[key].totalAmount += amountNum;
      summary[key].paymentsCount += 1;
    });

    return Object.values(summary);
  }

  // Gecikme / borç listesi (basit versiyon):
  //: Belirli bir tarihten beri ödeme yapmayan aktif üyeler
  async getOverdueMembers(
    since: Date,
    user: CurrentUserData,
  ) {
    const memberWhere = await this.scopeService.buildMemberWhereForUser(user);

    const activeMembers = await this.prisma.member.findMany({
      where: {
        ...memberWhere,
        status: 'ACTIVE',
      },
    });

    const overdue: {
      memberId: string;
      memberName: string;
      lastPaymentDate?: Date;
    }[] = [];

    for (const m of activeMembers) {
      const lastPayment = await this.prisma.duesPayment.findFirst({
        where: { memberId: m.id },
        orderBy: { paidAt: 'desc' },
      });

      if (!lastPayment || lastPayment.paidAt < since) {
        overdue.push({
          memberId: m.id,
          memberName: `${m.firstName} ${m.lastName}`,
          lastPaymentDate: lastPayment?.paidAt,
        });
      }
    }

    return overdue;
  }
}
