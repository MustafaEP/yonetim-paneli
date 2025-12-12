import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDuesPlanDto,
  UpdateDuesPlanDto,
  CreateDuesPaymentDto,
} from './dto';
import { MemberScopeService } from '../members/member-scope.service';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Prisma, MemberStatus } from '@prisma/client';

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
    // Üyenin var olup olmadığını kontrol et ve plan bilgisini al
    const member = await this.prisma.member.findFirst({
      where: {
        id: dto.memberId,
        deletedAt: null,
      },
      include: {
        duesPlan: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Üye bulunamadı');
    }

    // Reddedilmiş üyeler için ödeme yapılamaz
    if (member.status === MemberStatus.REJECTED) {
      throw new BadRequestException('Reddedilmiş üyeler için aidat ödemesi yapılamaz');
    }

    // Üyenin aktif bir planı olmalı
    if (!member.duesPlanId) {
      throw new BadRequestException('Üyenin aktif bir aidat planı yok');
    }

    // Planın aktif olduğunu kontrol et
    if (!member.duesPlan || !member.duesPlan.isActive || member.duesPlan.deletedAt) {
      throw new BadRequestException('Üyenin aidat planı aktif değil');
    }

    // Eğer DTO'da planId verilmişse ve üyenin planından farklıysa hata ver
    // (Ama genelde DTO'dan planId gelmeyecek, otomatik alacağız)
    const planIdToUse = dto.planId || member.duesPlanId;
    
    if (planIdToUse !== member.duesPlanId) {
      throw new BadRequestException('Ödeme, üyenin mevcut aidat planı ile eşleşmiyor');
    }

    // Tutar kontrolü
    if (dto.amount <= 0) {
      throw new BadRequestException('Tutar sıfırdan büyük olmalıdır');
    }

    // Ödeme oluştur - periodYear ve periodMonth gönderme (FIFO mantığı ile en eski borçlu aylara uygulanacak)
    return this.prisma.duesPayment.create({
      data: {
        memberId: dto.memberId,
        planId: planIdToUse,
        amount: new Prisma.Decimal(dto.amount),
        periodYear: null, // Artık belirli ay seçimi yok, FIFO ile uygulanacak
        periodMonth: null, // Artık belirli ay seçimi yok, FIFO ile uygulanacak
        note: dto.note || null,
        createdByUserId: user.userId,
        // paidAt otomatik olarak şimdiki tarih olarak ayarlanacak (schema'da @default(now()))
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
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
      include: {
        duesPlan: true,
      },
    });

    if (!member) {
      // yetkisiz veya yok → boş liste dönelim (ya da ForbiddenException fırlatılabilir)
      return [];
    }

    const payments = await this.prisma.duesPayment.findMany({
      where: { memberId, deletedAt: null },
      orderBy: { paidAt: 'desc' },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Eğer üyenin aylık planı yoksa veya plan yoksa, sadece ödemeleri döndür
    if (!member.duesPlan || member.duesPlan.period !== 'MONTHLY') {
      return payments.map((p) => ({
        ...p,
        amount: Number(p.amount),
        appliedMonths: null, // Aylık plan değilse null
      }));
    }

    // FIFO mantığı ile hangi ödemenin hangi aylara uygulandığını hesapla
    const planAmount = Number(member.duesPlan.amount);
    const now = new Date();
    const startDate = member.createdAt;
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Tüm ayları listele - gelecek ayları da dahil et (fazla ödemeler için)
    // Gelecek 12 ayı da ekliyoruz
    const monthlyDebts: Array<{
      year: number;
      month: number;
      remainingDebt: number;
      appliedPayments: Array<{ paymentId: string; amount: number }>;
      isFutureMonth: boolean; // Gelecek ay mı?
    }> = [];

    // Mevcut ve geçmiş aylar
    for (let year = startYear; year <= currentYear; year++) {
      const monthStart = year === startYear ? startMonth : 1;
      const monthEnd = year === currentYear ? currentMonth : 12;

      for (let month = monthStart; month <= monthEnd; month++) {
        monthlyDebts.push({
          year,
          month,
          remainingDebt: planAmount,
          appliedPayments: [],
          isFutureMonth: false,
        });
      }
    }

    // Gelecek ayları ekle (mevcut aydan sonraki 12 ay)
    let futureYear = currentYear;
    let futureMonth = currentMonth + 1;
    for (let i = 0; i < 12; i++) {
      if (futureMonth > 12) {
        futureMonth = 1;
        futureYear++;
      }
      monthlyDebts.push({
        year: futureYear,
        month: futureMonth,
        remainingDebt: planAmount,
        appliedPayments: [],
        isFutureMonth: true,
      });
      futureMonth++;
    }

    // Ödemeleri tarih sırasına göre sırala (en eski önce)
    const sortedPayments = [...payments].sort(
      (a, b) => a.paidAt.getTime() - b.paidAt.getTime(),
    );

    // Ödemeleri FIFO mantığı ile aylara dağıt
    const unallocatedPayments: Array<{ amount: number; paymentId: string }> = [];

    for (const payment of sortedPayments) {
      const paymentAmount = Number(payment.amount);
      let remainingPayment = paymentAmount;

      if (payment.periodYear && payment.periodMonth) {
        // Bu ödeme belirli bir ay için yapılmış
        const targetMonthDebt = monthlyDebts.find(
          (md) => md.year === payment.periodYear && md.month === payment.periodMonth,
        );

        if (targetMonthDebt && targetMonthDebt.remainingDebt > 0) {
          const applyToTarget = Math.min(remainingPayment, targetMonthDebt.remainingDebt);
          targetMonthDebt.remainingDebt -= applyToTarget;
          targetMonthDebt.appliedPayments.push({
            paymentId: payment.id,
            amount: applyToTarget,
          });
          remainingPayment -= applyToTarget;
        }

        if (remainingPayment > 0) {
          unallocatedPayments.push({
            amount: remainingPayment,
            paymentId: payment.id,
          });
        }
      } else {
        // Belirli bir ay bilgisi yok, FIFO mantığı ile en eski borçlu aya uygula
        unallocatedPayments.push({
          amount: paymentAmount,
          paymentId: payment.id,
        });
      }
    }

    // Dağıtılmamış ödemeleri FIFO mantığı ile en eski borçlu aylara uygula
    // Önce mevcut/geçmiş aylara, sonra gelecek aylara
    for (const unallocated of unallocatedPayments) {
      let remaining = unallocated.amount;

      // Önce mevcut/geçmiş aylara uygula
      for (const monthDebt of monthlyDebts) {
        if (remaining <= 0) break;
        if (monthDebt.isFutureMonth) continue; // Önce gelecek ayları atla
        if (monthDebt.remainingDebt <= 0) continue;

        const applyAmount = Math.min(remaining, monthDebt.remainingDebt);
        monthDebt.remainingDebt -= applyAmount;
        monthDebt.appliedPayments.push({
          paymentId: unallocated.paymentId,
          amount: applyAmount,
        });
        remaining -= applyAmount;
      }

      // Kalan fazla ödemeyi gelecek aylara uygula
      for (const monthDebt of monthlyDebts) {
        if (remaining <= 0) break;
        if (!monthDebt.isFutureMonth) continue; // Sadece gelecek aylara
        if (monthDebt.remainingDebt <= 0) continue;

        const applyAmount = Math.min(remaining, monthDebt.remainingDebt);
        monthDebt.remainingDebt -= applyAmount;
        monthDebt.appliedPayments.push({
          paymentId: unallocated.paymentId,
          amount: applyAmount,
        });
        remaining -= applyAmount;
      }
    }

    // Her ödeme için hangi aylara uygulandığını topla
    const paymentAppliedMonths: Record<string, Array<{ year: number; month: number; isFutureMonth?: boolean }>> = {};
    const paymentExcessAmount: Record<string, number> = {}; // Fazla ödeme miktarı

    for (const monthDebt of monthlyDebts) {
      for (const appliedPayment of monthDebt.appliedPayments) {
        if (!paymentAppliedMonths[appliedPayment.paymentId]) {
          paymentAppliedMonths[appliedPayment.paymentId] = [];
        }
        paymentAppliedMonths[appliedPayment.paymentId].push({
          year: monthDebt.year,
          month: monthDebt.month,
          isFutureMonth: monthDebt.isFutureMonth,
        });
      }
    }

    // Her ödeme için fazla ödeme miktarını hesapla
    for (const payment of payments) {
      const paymentAmount = Number(payment.amount);
      const appliedMonths = paymentAppliedMonths[payment.id] || [];
      
      // Toplam uygulanan tutar (geçmiş + gelecek aylar)
      let totalApplied = 0;
      for (const monthDebt of monthlyDebts) {
        for (const appliedPayment of monthDebt.appliedPayments) {
          if (appliedPayment.paymentId === payment.id) {
            totalApplied += appliedPayment.amount;
          }
        }
      }
      
      // Eğer gelecek aylara uygulanan tutar varsa, bu fazla ödemedir
      let excessAmount = 0;
      for (const monthDebt of monthlyDebts) {
        if (monthDebt.isFutureMonth) {
          for (const appliedPayment of monthDebt.appliedPayments) {
            if (appliedPayment.paymentId === payment.id) {
              excessAmount += appliedPayment.amount;
            }
          }
        }
      }
      
      if (excessAmount > 0) {
        paymentExcessAmount[payment.id] = excessAmount;
      }
    }

    // Ödemeleri döndür, her ödeme için hangi aylara uygulandığını ekle
    return payments.map((p) => {
      const appliedMonths = paymentAppliedMonths[p.id] || null;
      const excessAmount = paymentExcessAmount[p.id] || 0;
      
      // Debug log
      if (appliedMonths && appliedMonths.length > 0) {
        console.log(`[getPaymentsForMember] Payment ${p.id}: appliedMonths =`, appliedMonths, 'excessAmount =', excessAmount);
      } else if (!appliedMonths) {
        console.log(`[getPaymentsForMember] Payment ${p.id}: No appliedMonths found`);
      }
      
      return {
        id: p.id,
        memberId: p.memberId,
        planId: p.planId,
        amount: Number(p.amount),
        paidAt: p.paidAt.toISOString(), // ISO string'e çevir
        periodYear: p.periodYear,
        periodMonth: p.periodMonth,
        note: p.note,
        plan: p.plan,
        appliedMonths: appliedMonths ? appliedMonths.map(m => ({ year: m.year, month: m.month })) : null,
        excessAmount: excessAmount > 0 ? excessAmount : null, // Fazla ödeme miktarı (sadece varsa)
      };
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

  // Dashboard özeti: toplam tahsilat, toplam üye, bu ay ödeme yapan, ödeme oranı, aylık tahsilat
  async getDuesSummary(user: CurrentUserData) {
    const memberWhere = await this.scopeService.buildMemberWhereForUser(user);

    // Tüm aktif üyeler (aidat planı olan)
    const allMembers = await this.prisma.member.findMany({
      where: {
        ...memberWhere,
        status: 'ACTIVE',
        duesPlanId: { not: null },
        deletedAt: null,
        isActive: true,
      },
    });

    const totalMembers = allMembers.length;

    // Tüm ödemeler
    const allPayments = await this.prisma.duesPayment.findMany({
      where: {
        member: {
          ...memberWhere,
        },
        deletedAt: null,
      },
      include: {
        member: true,
      },
    });

    // Toplam tahsilat
    const totalPayments = allPayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0,
    );

    // Bu ay ödeme yapan üyeler
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    const thisMonthStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    const thisMonthPayments = allPayments.filter((p) => {
      const paidAt = p.paidAt instanceof Date ? p.paidAt : new Date(p.paidAt);
      return paidAt >= thisMonthStart && paidAt <= thisMonthEnd;
    });

    const paidMembersThisMonth = new Set(
      thisMonthPayments.map((p) => p.memberId),
    ).size;

    // Aylık tahsilat (son 12 ay)
    const monthlyData: Record<string, { total: number; count: number }> = {};

    allPayments.forEach((p) => {
      // Prisma'dan gelen paidAt bir Date objesi veya string olabilir
      const paidAt = p.paidAt instanceof Date ? p.paidAt : new Date(p.paidAt);
      if (isNaN(paidAt.getTime())) {
        // Geçersiz tarih, atla
        return;
      }
      const year = paidAt.getFullYear();
      const month = paidAt.getMonth() + 1; // 1-12
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const key = `${year}-${monthStr}`;

      if (!monthlyData[key]) {
        monthlyData[key] = { total: 0, count: 0 };
      }

      monthlyData[key].total += Number(p.amount);
      monthlyData[key].count += 1;
    });

    // Son 12 ayı al (en eski ay en başta)
    const byMonth: Array<{ month: number; year: number; total: number; count: number }> = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // 1-12
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const key = `${year}-${monthStr}`;

      byMonth.push({
        year,
        month,
        total: monthlyData[key]?.total || 0,
        count: monthlyData[key]?.count || 0,
      });
    }

    // Bu ay gelen üye sayısı (bu ay içinde onaylanmış/aktif olan üyeler)
    const thisMonthNewMembers = await this.prisma.member.count({
      where: {
        ...memberWhere,
        status: 'ACTIVE',
        approvedAt: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
        deletedAt: null,
        isActive: true,
      },
    });

    // Bu ay iptal edilen üye sayısı (bu ay içinde iptal edilmiş üyeler)
    const thisMonthCancelledMembers = await this.prisma.member.count({
      where: {
        ...memberWhere,
        status: {
          in: ['RESIGNED', 'EXPELLED', 'INACTIVE'],
        },
        cancelledAt: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
        deletedAt: null,
        isActive: true,
      },
    });

    return {
      totalPayments,
      totalMembers,
      paidMembers: paidMembersThisMonth, // Bu ay ödeme yapan üye sayısı
      unpaidMembers: totalMembers - paidMembersThisMonth,
      newMembersThisMonth: thisMonthNewMembers, // Bu ay gelen üye sayısı
      cancelledMembersThisMonth: thisMonthCancelledMembers, // Bu ay iptal edilen üye sayısı
      byMonth,
    };
  }

  // Tüm aylık tahsilat raporu: tüm zamanlar için aylık özet
  async getMonthlyPaymentsReport(user: CurrentUserData) {
    const memberWhere = await this.scopeService.buildMemberWhereForUser(user);

    // Tüm ödemeler
    const allPayments = await this.prisma.duesPayment.findMany({
      where: {
        member: {
          ...memberWhere,
        },
        deletedAt: null,
      },
      include: {
        member: true,
      },
    });

    // Aylık tahsilat (tüm zamanlar)
    const monthlyData: Record<string, { total: number; count: number }> = {};

    allPayments.forEach((p) => {
      // Prisma'dan gelen paidAt bir Date objesi veya string olabilir
      const paidAt = p.paidAt instanceof Date ? p.paidAt : new Date(p.paidAt);
      if (isNaN(paidAt.getTime())) {
        // Geçersiz tarih, atla
        return;
      }
      const year = paidAt.getFullYear();
      const month = paidAt.getMonth() + 1; // 1-12
      const monthStr = month < 10 ? `0${month}` : `${month}`;
      const key = `${year}-${monthStr}`;

      if (!monthlyData[key]) {
        monthlyData[key] = { total: 0, count: 0 };
      }

      monthlyData[key].total += Number(p.amount);
      monthlyData[key].count += 1;
    });

    // Tüm ayları sıralı olarak al
    const byMonth: Array<{ month: number; year: number; total: number; count: number }> = [];
    const keys = Object.keys(monthlyData).sort();
    
    keys.forEach((key) => {
      const [yearStr, monthStr] = key.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      
      byMonth.push({
        year,
        month,
        total: monthlyData[key]?.total || 0,
        count: monthlyData[key]?.count || 0,
      });
    });

    return byMonth;
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
        duesPlanId: { not: null }, // Aidat planı olan üyeler
      },
      include: {
        duesPlan: true,
      },
    });

    const overdue: Array<{
      memberId: string;
      member: {
        id: string;
        firstName: string;
        lastName: string;
      };
      lastPaymentDate: string | null;
      monthsOverdue: number;
      totalDebt: number;
    }> = [];

    for (const m of activeMembers) {
      if (!m.duesPlan) continue;

      const planAmount = Number(m.duesPlan.amount);
      const period = m.duesPlan.period;
      const now = new Date();
      let totalDebt = 0;
      let monthsOverdue = 0;

      if (period === 'MONTHLY') {
        // Aylık plan: Her ay için borç hesapla ve FIFO mantığı ile ödemeleri eşleştir
        const startDate = m.createdAt;
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth() + 1;
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // Tüm ödemeleri getir (tarih sırasına göre)
        const allPayments = await this.prisma.duesPayment.findMany({
          where: {
            memberId: m.id,
            deletedAt: null,
          },
          orderBy: { paidAt: 'asc' }, // En eski ödemeler önce
        });

        // Her ay için borç durumunu tut
        const monthlyDebts: Array<{
          year: number;
          month: number;
          expectedAmount: number;
          paidAmount: number;
          remainingDebt: number;
        }> = [];

        // Önce tüm ayları listele
        for (let year = startYear; year <= currentYear; year++) {
          const monthStart = year === startYear ? startMonth : 1;
          const monthEnd = year === currentYear ? currentMonth : 12;

          for (let month = monthStart; month <= monthEnd; month++) {
            monthlyDebts.push({
              year,
              month,
              expectedAmount: planAmount,
              paidAmount: 0,
              remainingDebt: planAmount,
            });
          }
        }

        // Ödemeleri FIFO mantığı ile aylara dağıt
        // Önce belirli ay/yıl bilgisi olan ödemeleri eşleştir
        // Eğer hedef ay zaten ödendiyse veya ödeme o aya tam uygulanamıyorsa, fazlası FIFO ile dağıtılır
        const unallocatedPayments: Array<{ amount: number; paidAt: Date }> = [];

        for (const payment of allPayments) {
          const paymentAmount = Number(payment.amount);
          let remainingPayment = paymentAmount;

          if (payment.periodYear && payment.periodMonth) {
            // Bu ödeme belirli bir ay için yapılmış
            const targetMonthDebt = monthlyDebts.find(
              (md) => md.year === payment.periodYear && md.month === payment.periodMonth,
            );

            if (targetMonthDebt && targetMonthDebt.remainingDebt > 0) {
              // Hedef ayın borcu var, önce ona uygula
              const applyToTarget = Math.min(remainingPayment, targetMonthDebt.remainingDebt);
              targetMonthDebt.paidAmount += applyToTarget;
              targetMonthDebt.remainingDebt -= applyToTarget;
              remainingPayment -= applyToTarget;
            }

            // Eğer ödeme tutarı hedef aya uygulandıktan sonra hala varsa,
            // fazlasını FIFO mantığı ile en eski borçlu aylara uygula
            if (remainingPayment > 0) {
              unallocatedPayments.push({
                amount: remainingPayment,
                paidAt: payment.paidAt,
              });
            }
          } else {
            // Belirli bir ay bilgisi yok, FIFO mantığı ile en eski borçlu aya uygula
            unallocatedPayments.push({
              amount: paymentAmount,
              paidAt: payment.paidAt,
            });
          }
        }

        // Dağıtılmamış ödemeleri FIFO mantığı ile en eski borçlu aylara uygula
        for (const unallocated of unallocatedPayments) {
          let remaining = unallocated.amount;

          for (const monthDebt of monthlyDebts) {
            if (remaining <= 0) break;
            if (monthDebt.remainingDebt <= 0) continue;

            const applyAmount = Math.min(remaining, monthDebt.remainingDebt);
            monthDebt.paidAmount += applyAmount;
            monthDebt.remainingDebt -= applyAmount;
            remaining -= applyAmount;
          }
        }

        // Toplam borç: Kalan borçlu ayların toplamı
        totalDebt = monthlyDebts.reduce((sum, md) => sum + md.remainingDebt, 0);
        monthsOverdue = monthlyDebts.filter((md) => md.remainingDebt > 0).length;
      } else if (period === 'YEARLY') {
        // Yıllık plan
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearPayments = await this.prisma.duesPayment.findMany({
          where: {
            memberId: m.id,
            paidAt: { gte: yearStart },
            deletedAt: null,
          },
        });

        const totalPaid = yearPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0,
        );
        totalDebt = Math.max(0, planAmount - totalPaid);
        monthsOverdue = totalDebt > 0 ? 1 : 0;
      }

      // Borcu olan üyeleri listele
      if (totalDebt > 0) {
        const lastPayment = await this.prisma.duesPayment.findFirst({
          where: { memberId: m.id },
          orderBy: { paidAt: 'desc' },
        });

        overdue.push({
          memberId: m.id,
          member: {
            id: m.id,
            firstName: m.firstName,
            lastName: m.lastName,
          },
          lastPaymentDate: lastPayment?.paidAt?.toISOString() || null,
          monthsOverdue,
          totalDebt,
        });
      }
    }

    // Borç miktarına göre azalan sıralama (en borçlu en üstte)
    overdue.sort((a, b) => b.totalDebt - a.totalDebt);

    return overdue;
  }

  // Belirli bir üyenin borç bilgisi
  async getMemberDebt(
    memberId: string,
    user: CurrentUserData,
  ) {
    // Kullanıcının bu üyeyi görme yetkisi var mı kontrol et
    const memberWhere = await this.scopeService.buildMemberWhereForUser(user);

    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        ...memberWhere,
      },
      include: {
        duesPlan: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Üye bulunamadı veya yetkiniz yok');
    }

    // Sadece aktif üyeler ve aidat planı olanlar borçlu olabilir
    if (member.status !== 'ACTIVE' || !member.duesPlan) {
      return {
        memberId: member.id,
        member: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
        },
        lastPaymentDate: null,
        monthsOverdue: 0,
        totalDebt: 0,
      };
    }

    const planAmount = Number(member.duesPlan.amount);
    const period = member.duesPlan.period;
    const now = new Date();

    if (period === 'MONTHLY') {
      // Aylık plan için: Her ay için borç hesapla ve FIFO mantığı ile ödemeleri eşleştir
      // Başlangıç: üyenin kayıt tarihi
      const startDate = member.createdAt;
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth() + 1; // 1-12
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12

      // Tüm ödemeleri getir (tarih sırasına göre)
      const allPayments = await this.prisma.duesPayment.findMany({
        where: {
          memberId: member.id,
          deletedAt: null,
        },
        orderBy: { paidAt: 'asc' }, // En eski ödemeler önce
      });

      // Her ay için borç durumunu tut
      const monthlyDebts: Array<{
        year: number;
        month: number;
        expectedAmount: number;
        paidAmount: number;
        remainingDebt: number;
      }> = [];

      // Önce tüm ayları listele
      // Önemli: Mevcut ay dahil değil, çünkü o ay henüz bitmemiş olabilir
      // Ama eğer ayın ortasındaysak ve ay bitmişse, mevcut ayı da dahil edebiliriz
      // Şimdilik mevcut ayı da dahil edelim (kullanıcı talebi doğrultusunda)
      for (let year = startYear; year <= currentYear; year++) {
        const monthStart = year === startYear ? startMonth : 1;
        // Mevcut ayı dahil et
        const monthEnd = year === currentYear ? currentMonth : 12;

        for (let month = monthStart; month <= monthEnd; month++) {
          // Bu ay için ödeme bekleniyor
          monthlyDebts.push({
            year,
            month,
            expectedAmount: planAmount,
            paidAmount: 0,
            remainingDebt: planAmount,
          });
        }
      }

      console.log(`[getMemberDebt] Member ${member.id}: Created ${monthlyDebts.length} monthly debt entries`);
      console.log(`[getMemberDebt] Start: ${startYear}-${startMonth}, End: ${currentYear}-${currentMonth}`);

      // Ödemeleri FIFO mantığı ile aylara dağıt
      // Önce belirli ay/yıl bilgisi olan ödemeleri eşleştir
      // Eğer hedef ay zaten ödendiyse veya ödeme o aya tam uygulanamıyorsa, fazlası FIFO ile dağıtılır
      const unallocatedPayments: Array<{ amount: number; paidAt: Date }> = [];

      for (const payment of allPayments) {
        const paymentAmount = Number(payment.amount);
        let remainingPayment = paymentAmount;

        if (payment.periodYear && payment.periodMonth) {
          // Bu ödeme belirli bir ay için yapılmış
          const targetMonthDebt = monthlyDebts.find(
            (md) => md.year === payment.periodYear && md.month === payment.periodMonth,
          );

          if (targetMonthDebt && targetMonthDebt.remainingDebt > 0) {
            // Hedef ayın borcu var, önce ona uygula
            const applyToTarget = Math.min(remainingPayment, targetMonthDebt.remainingDebt);
            targetMonthDebt.paidAmount += applyToTarget;
            targetMonthDebt.remainingDebt -= applyToTarget;
            remainingPayment -= applyToTarget;
          }

          // Eğer ödeme tutarı hedef aya uygulandıktan sonra hala varsa,
          // fazlasını FIFO mantığı ile en eski borçlu aylara uygula
          if (remainingPayment > 0) {
            unallocatedPayments.push({
              amount: remainingPayment,
              paidAt: payment.paidAt,
            });
          }
        } else {
          // Belirli bir ay bilgisi yok, FIFO mantığı ile en eski borçlu aya uygula
          unallocatedPayments.push({
            amount: paymentAmount,
            paidAt: payment.paidAt,
          });
        }
      }

      // Dağıtılmamış ödemeleri FIFO mantığı ile en eski borçlu aylara uygula
      for (const unallocated of unallocatedPayments) {
        let remaining = unallocated.amount;

        for (const monthDebt of monthlyDebts) {
          if (remaining <= 0) break;
          if (monthDebt.remainingDebt <= 0) continue;

          const applyAmount = Math.min(remaining, monthDebt.remainingDebt);
          monthDebt.paidAmount += applyAmount;
          monthDebt.remainingDebt -= applyAmount;
          remaining -= applyAmount;
        }
      }

      // Toplam borç: Kalan borçlu ayların toplamı
      const totalDebt = monthlyDebts.reduce((sum, md) => sum + md.remainingDebt, 0);

      // Geciken ay sayısı: Borcu olan ayların sayısı
      const monthsOverdue = monthlyDebts.filter((md) => md.remainingDebt > 0).length;

      // Debug: Borçlu ayları logla
      const overdueMonthsList = monthlyDebts
        .filter((md) => md.remainingDebt > 0)
        .map((md) => `${md.year}-${String(md.month).padStart(2, '0')}: ${md.remainingDebt.toFixed(2)} TL`);
      console.log(`[getMemberDebt] Total debt: ${totalDebt.toFixed(2)} TL, Overdue months: ${monthsOverdue}`);
      console.log(`[getMemberDebt] Overdue months: [${overdueMonthsList.join(', ')}]`);
      console.log(`[getMemberDebt] All payments: ${allPayments.length}, Payments with period: ${allPayments.filter((p) => p.periodYear && p.periodMonth).length}`);

      // Son ödeme tarihi
      const lastPayment = await this.prisma.duesPayment.findFirst({
        where: { memberId: member.id },
        orderBy: { paidAt: 'desc' },
      });

      return {
        memberId: member.id,
        member: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
        },
        lastPaymentDate: lastPayment?.paidAt?.toISOString() || null,
        monthsOverdue,
        totalDebt,
      };
    } else if (period === 'YEARLY') {
      // Yıllık plan için: Mevcut yıl için ödeme kontrolü
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const yearPayments = await this.prisma.duesPayment.findMany({
        where: {
          memberId: member.id,
          paidAt: { gte: yearStart },
          deletedAt: null,
        },
      });

      const totalPaid = yearPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0,
      );
      const totalDebt = Math.max(0, planAmount - totalPaid);

      const lastPayment = await this.prisma.duesPayment.findFirst({
        where: { memberId: member.id },
        orderBy: { paidAt: 'desc' },
      });

      return {
        memberId: member.id,
        member: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
        },
        lastPaymentDate: lastPayment?.paidAt?.toISOString() || null,
        monthsOverdue: totalDebt > 0 ? 1 : 0,
        totalDebt,
      };
    }

    // Diğer durumlar için
    const lastPayment = await this.prisma.duesPayment.findFirst({
      where: { memberId: member.id },
      orderBy: { paidAt: 'desc' },
    });

    return {
      memberId: member.id,
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
      },
      lastPaymentDate: lastPayment?.paidAt?.toISOString() || null,
      monthsOverdue: 0,
      totalDebt: 0,
    };
  }

  // Üyenin aylık borç durumu (belirli bir yıl için)
  async getMemberMonthlyDebts(
    memberId: string,
    year: number,
    user: CurrentUserData,
  ) {
    // Kullanıcının bu üyeyi görme yetkisi var mı kontrol et
    const memberWhere = await this.scopeService.buildMemberWhereForUser(user);

    const member = await this.prisma.member.findFirst({
      where: {
        id: memberId,
        ...memberWhere,
      },
      include: {
        duesPlan: true,
      },
    });

    if (!member || !member.duesPlan || member.duesPlan.period !== 'MONTHLY') {
      // Aylık plan yoksa boş döndür
      return {
        memberId: member?.id || memberId,
        year,
        planAmount: 0,
        months: [],
      };
    }

    const planAmount = Number(member.duesPlan.amount);
    const now = new Date();

    // FIFO mantığı ile borç hesaplama - getMemberDebt ile aynı mantık
    const startDate = member.createdAt;
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Tüm ödemeleri getir (tarih sırasına göre)
    const allPayments = await this.prisma.duesPayment.findMany({
      where: {
        memberId: member.id,
        deletedAt: null,
      },
      orderBy: { paidAt: 'asc' }, // En eski ödemeler önce
    });

    // İstenen yıl için ayları listele
    const monthlyDebts: Array<{
      year: number;
      month: number;
      expectedAmount: number;
      paidAmount: number;
      remainingDebt: number;
      appliedPayments: Array<{ paymentId: string; amount: number; paidAt: Date }>;
    }> = [];

    // Sadece istenen yıl için ayları oluştur
    const yearStartMonth = year === startYear ? startMonth : 1;
    const yearEndMonth = year === currentYear ? currentMonth : 12;

    for (let month = yearStartMonth; month <= yearEndMonth; month++) {
      monthlyDebts.push({
        year,
        month,
        expectedAmount: planAmount,
        paidAmount: 0,
        remainingDebt: planAmount,
        appliedPayments: [],
      });
    }

    // Ödemeleri FIFO mantığı ile aylara dağıt
    const unallocatedPayments: Array<{ amount: number; paidAt: Date; paymentId: string }> = [];

    for (const payment of allPayments) {
      const paymentAmount = Number(payment.amount);
      let remainingPayment = paymentAmount;

      if (payment.periodYear && payment.periodMonth) {
        // Bu ödeme belirli bir ay için yapılmış
        const targetMonthDebt = monthlyDebts.find(
          (md) => md.year === payment.periodYear && md.month === payment.periodMonth,
        );

        if (targetMonthDebt && targetMonthDebt.remainingDebt > 0) {
          // Hedef ayın borcu var, önce ona uygula
          const applyToTarget = Math.min(remainingPayment, targetMonthDebt.remainingDebt);
          targetMonthDebt.paidAmount += applyToTarget;
          targetMonthDebt.remainingDebt -= applyToTarget;
          targetMonthDebt.appliedPayments.push({
            paymentId: payment.id,
            amount: applyToTarget,
            paidAt: payment.paidAt,
          });
          remainingPayment -= applyToTarget;
        }

        // Eğer ödeme tutarı hedef aya uygulandıktan sonra hala varsa,
        // fazlasını FIFO mantığı ile en eski borçlu aylara uygula
        if (remainingPayment > 0) {
          unallocatedPayments.push({
            amount: remainingPayment,
            paidAt: payment.paidAt,
            paymentId: payment.id,
          });
        }
      } else {
        // Belirli bir ay bilgisi yok, FIFO mantığı ile en eski borçlu aya uygula
        unallocatedPayments.push({
          amount: paymentAmount,
          paidAt: payment.paidAt,
          paymentId: payment.id,
        });
      }
    }

    // Dağıtılmamış ödemeleri FIFO mantığı ile en eski borçlu aylara uygula
    for (const unallocated of unallocatedPayments) {
      let remaining = unallocated.amount;

      for (const monthDebt of monthlyDebts) {
        if (remaining <= 0) break;
        if (monthDebt.remainingDebt <= 0) continue;

        const applyAmount = Math.min(remaining, monthDebt.remainingDebt);
        monthDebt.paidAmount += applyAmount;
        monthDebt.remainingDebt -= applyAmount;
        monthDebt.appliedPayments.push({
          paymentId: unallocated.paymentId,
          amount: applyAmount,
          paidAt: unallocated.paidAt,
        });
        remaining -= applyAmount;
      }
    }

    // Sonucu formatla
    const monthNames = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
    ];

    const monthlyStatus = monthlyDebts.map((md) => {
      // Bu aya uygulanan ödemelerden en son yapılanı al
      const lastPayment = md.appliedPayments.length > 0
        ? md.appliedPayments[md.appliedPayments.length - 1]
        : null;

      return {
        month: md.month,
        monthName: monthNames[md.month - 1],
        amount: planAmount,
        isPaid: md.remainingDebt <= 0,
        paymentId: lastPayment?.paymentId,
        paidAt: lastPayment?.paidAt?.toISOString(),
      };
    });

    return {
      memberId: member.id,
      year,
      planAmount,
      months: monthlyStatus,
    };
  }

  private calculateMonthsDifference(date1: Date, date2: Date): number {
    // Tarihleri normalize et (saat bilgilerini sıfırla)
    const d1 = new Date(date1.getFullYear(), date1.getMonth(), 1);
    const d2 = new Date(date2.getFullYear(), date2.getMonth(), 1);
    
    const months = (d2.getFullYear() - d1.getFullYear()) * 12 + 
                   (d2.getMonth() - d1.getMonth());
    
    // En az 0 döndür (negatif olmasın)
    return Math.max(0, months);
  }
}
