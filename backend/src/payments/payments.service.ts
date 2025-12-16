import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberPaymentDto } from './dto/create-member-payment.dto';
import { PaymentType, MemberStatus } from '@prisma/client';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Üye ödemesi oluştur
   */
  async createPayment(
    dto: CreateMemberPaymentDto,
    createdBy: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Üyenin var olduğunu ve aktif olduğunu kontrol et
    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
      select: {
        id: true,
        registrationNumber: true,
        status: true,
        isActive: true,
        deletedAt: true,
        tevkifatCenterId: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Üye bulunamadı');
    }

    if (member.status !== MemberStatus.ACTIVE || !member.isActive || member.deletedAt) {
      throw new BadRequestException('Aktif olmayan üye için ödeme kaydedilemez');
    }

    // TEVKIFAT tipinde tevkifatCenterId zorunlu
    if (dto.paymentType === PaymentType.TEVKIFAT && !dto.tevkifatCenterId) {
      throw new BadRequestException('Tevkifat ödemesi için tevkifat merkezi seçilmelidir');
    }

    // Tevkifat merkezi kontrolü (varsa)
    if (dto.tevkifatCenterId) {
      const tevkifatCenter = await this.prisma.tevkifatCenter.findUnique({
        where: { id: dto.tevkifatCenterId },
      });

      if (!tevkifatCenter) {
        throw new NotFoundException('Tevkifat merkezi bulunamadı');
      }
    }

    // Tevkifat dosyası kontrolü (varsa)
    if (dto.tevkifatFileId) {
      const tevkifatFile = await this.prisma.tevkifatFile.findUnique({
        where: { id: dto.tevkifatFileId },
      });

      if (!tevkifatFile) {
        throw new NotFoundException('Tevkifat dosyası bulunamadı');
      }
    }

    // Aynı üye, ay, yıl için ödeme var mı kontrol et
    const existingPayment = await this.prisma.memberPayment.findFirst({
      where: {
        memberId: dto.memberId,
        paymentPeriodYear: dto.paymentPeriodYear,
        paymentPeriodMonth: dto.paymentPeriodMonth,
        isApproved: true, // Sadece onaylı ödemeleri kontrol et
      },
    });

    if (existingPayment) {
      throw new BadRequestException(
        'Bu üye için bu ay/yıl döneminde zaten onaylı bir ödeme kaydı bulunmaktadır',
      );
    }

    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    return this.prisma.memberPayment.create({
      data: {
        memberId: dto.memberId,
        registrationNumber: member.registrationNumber,
        paymentDate,
        paymentPeriodMonth: dto.paymentPeriodMonth,
        paymentPeriodYear: dto.paymentPeriodYear,
        amount: dto.amount,
        paymentType: dto.paymentType,
        tevkifatCenterId: dto.tevkifatCenterId || null,
        tevkifatFileId: dto.tevkifatFileId || null,
        description: dto.description || null,
        documentUrl: dto.documentUrl || null,
        isApproved: false, // Varsayılan olarak onaysız
        createdByUserId: createdBy,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
          },
        },
        tevkifatCenter: {
          select: {
            id: true,
            name: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Ödeme listesi (filtreleme ile)
   */
  async listPayments(filters?: {
    memberId?: string;
    year?: number;
    month?: number;
    paymentType?: PaymentType;
    tevkifatCenterId?: string;
    branchId?: string;
    provinceId?: string;
    districtId?: string;
    isApproved?: boolean;
    registrationNumber?: string;
  }) {
    const where: any = {};

    if (filters?.memberId) {
      where.memberId = filters.memberId;
    }

    if (filters?.year) {
      where.paymentPeriodYear = filters.year;
    }

    if (filters?.month) {
      where.paymentPeriodMonth = filters.month;
    }

    if (filters?.paymentType) {
      where.paymentType = filters.paymentType;
    }

    if (filters?.tevkifatCenterId) {
      where.tevkifatCenterId = filters.tevkifatCenterId;
    }

    if (filters?.registrationNumber) {
      where.registrationNumber = filters.registrationNumber;
    }

    if (filters?.isApproved !== undefined) {
      where.isApproved = filters.isApproved;
    }

    // Şube filtresi
    if (filters?.branchId) {
      where.member = {
        branchId: filters.branchId,
      };
    }

    // İl/İlçe filtresi
    if (filters?.provinceId || filters?.districtId) {
      where.member = {
        ...where.member,
        ...(filters.provinceId && { provinceId: filters.provinceId }),
        ...(filters.districtId && { districtId: filters.districtId }),
      };
    }

    return this.prisma.memberPayment.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
            tevkifatCenter: {
              select: {
                id: true,
                name: true,
              },
            },
            province: {
              select: {
                id: true,
                name: true,
              },
            },
            district: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tevkifatCenter: {
          select: {
            id: true,
            name: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { paymentPeriodYear: 'desc' },
        { paymentPeriodMonth: 'desc' },
        { paymentDate: 'desc' },
      ],
    });
  }

  /**
   * Üye ödemelerini listele (memberId'ye göre)
   */
  async getMemberPayments(memberId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });

    if (!member) {
      throw new NotFoundException('Üye bulunamadı');
    }

    return this.prisma.memberPayment.findMany({
      where: { memberId },
      include: {
        tevkifatCenter: {
          select: {
            id: true,
            name: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { paymentPeriodYear: 'desc' },
        { paymentPeriodMonth: 'desc' },
        { paymentDate: 'desc' },
      ],
    });
  }

  /**
   * Ödeme detayı
   */
  async getPaymentById(id: string) {
    const payment = await this.prisma.memberPayment.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
            tevkifatCenter: {
              select: {
                id: true,
                name: true,
              },
            },
            province: {
              select: {
                id: true,
                name: true,
              },
            },
            district: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tevkifatCenter: {
          select: {
            id: true,
            name: true,
          },
        },
        tevkifatFile: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Ödeme kaydı bulunamadı');
    }

    return payment;
  }

  /**
   * Ödemeyi onayla (Admin)
   */
  async approvePayment(id: string, approvedBy: string) {
    const payment = await this.prisma.memberPayment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Ödeme kaydı bulunamadı');
    }

    if (payment.isApproved) {
      throw new BadRequestException('Bu ödeme zaten onaylanmış');
    }

    return this.prisma.memberPayment.update({
      where: { id },
      data: {
        isApproved: true,
        approvedByUserId: approvedBy,
        approvedAt: new Date(),
      },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Ödemeyi iptal et / sil (Admin)
   */
  async deletePayment(id: string) {
    const payment = await this.prisma.memberPayment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Ödeme kaydı bulunamadı');
    }

    if (payment.isApproved) {
      throw new BadRequestException('Onaylı ödemeler silinemez');
    }

    return this.prisma.memberPayment.delete({
      where: { id },
    });
  }

  /**
   * Muhasebe için ödeme listesi (Excel/PDF export için)
   */
  async getPaymentsForAccounting(filters?: {
    branchId?: string;
    tevkifatCenterId?: string;
    year?: number;
    month?: number;
    isApproved?: boolean;
  }) {
    const where: any = {
      ...(filters?.isApproved !== undefined && { isApproved: filters.isApproved }),
    };

    if (filters?.branchId) {
      where.member = {
        branchId: filters.branchId,
        status: MemberStatus.ACTIVE,
        isActive: true,
        deletedAt: null,
      };
    }

    if (filters?.tevkifatCenterId) {
      where.tevkifatCenterId = filters.tevkifatCenterId;
    }

    if (filters?.year) {
      where.paymentPeriodYear = filters.year;
    }

    if (filters?.month) {
      where.paymentPeriodMonth = filters.month;
    }

    return this.prisma.memberPayment.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            registrationNumber: true,
            firstName: true,
            lastName: true,
            institution: {
              select: {
                id: true,
                name: true,
              },
            },
            tevkifatCenter: {
              select: {
                id: true,
                name: true,
              },
            },
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        tevkifatCenter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { paymentPeriodYear: 'desc' },
        { paymentPeriodMonth: 'desc' },
        { member: { registrationNumber: 'asc' } },
      ],
    });
  }
}
