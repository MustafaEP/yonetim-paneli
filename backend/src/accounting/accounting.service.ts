import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadTevkifatFileDto } from './dto/upload-tevkifat-file.dto';
import { CreateTevkifatCenterDto } from './dto/create-tevkifat-center.dto';
import { UpdateTevkifatCenterDto } from './dto/update-tevkifat-center.dto';
import { ApprovalStatus, MemberStatus } from '@prisma/client';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Injectable()
export class AccountingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Muhasebe üyeleri listele (Excel/PDF export için)
   */
  async getMembersForAccounting(filters?: {
    branchId?: string;
    tevkifatCenterId?: string;
    year?: number;
    month?: number;
  }) {
    const where: any = {
      status: MemberStatus.ACTIVE,
      deletedAt: null,
      isActive: true,
    };

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.tevkifatCenterId) {
      where.tevkifatCenterId = filters.tevkifatCenterId;
    }

    return this.prisma.member.findMany({
      where,
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
      orderBy: {
        registrationNumber: 'asc',
      },
    });
  }

  /**
   * Tevkifat dosyası yükle
   */
  async uploadTevkifatFile(
    dto: UploadTevkifatFileDto,
    uploadedBy: string,
  ) {
    // Tevkifat merkezinin var olduğunu kontrol et
    const tevkifatCenter = await this.prisma.tevkifatCenter.findUnique({
      where: { id: dto.tevkifatCenterId },
    });

    if (!tevkifatCenter) {
      throw new NotFoundException('Tevkifat merkezi bulunamadı');
    }

    // Aynı ay/yıl/kurum için dosya var mı kontrol et
    const existing = await this.prisma.tevkifatFile.findFirst({
      where: {
        tevkifatCenterId: dto.tevkifatCenterId,
        year: dto.year,
        month: dto.month,
        positionTitle: dto.positionTitle || null,
        status: {
          in: [ApprovalStatus.PENDING, ApprovalStatus.APPROVED],
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Bu ay/yıl için zaten bir dosya yüklenmiş');
    }

    return this.prisma.tevkifatFile.create({
      data: {
        tevkifatCenterId: dto.tevkifatCenterId,
        totalAmount: dto.totalAmount,
        memberCount: dto.memberCount,
        month: dto.month,
        year: dto.year,
        positionTitle: dto.positionTitle || null,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        fileSize: dto.fileSize || null,
        status: ApprovalStatus.PENDING, // Admin onayı bekler
        uploadedBy,
      },
      include: {
        tevkifatCenter: {
          select: {
            id: true,
            name: true,
          },
        },
        uploadedByUser: {
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
   * Tevkifat dosyalarını listele
   */
  async listTevkifatFiles(filters?: {
    year?: number;
    month?: number;
    tevkifatCenterId?: string;
    status?: ApprovalStatus;
  }) {
    const where: any = {};

    if (filters?.year) {
      where.year = filters.year;
    }

    if (filters?.month) {
      where.month = filters.month;
    }

    if (filters?.tevkifatCenterId) {
      where.tevkifatCenterId = filters.tevkifatCenterId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    return this.prisma.tevkifatFile.findMany({
      where,
      include: {
        tevkifatCenter: {
          select: {
            id: true,
            name: true,
          },
        },
        uploadedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Tevkifat dosyasını onayla
   */
  async approveTevkifatFile(id: string, approvedBy: string) {
    const file = await this.prisma.tevkifatFile.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('Tevkifat dosyası bulunamadı');
    }

    if (file.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Bu dosya zaten işlenmiş');
    }

    return this.prisma.tevkifatFile.update({
      where: { id },
      data: {
        status: ApprovalStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
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
            email: true,
          },
        },
      },
    });
  }

  /**
   * Tevkifat dosyasını reddet
   */
  async rejectTevkifatFile(id: string, rejectedBy: string) {
    const file = await this.prisma.tevkifatFile.findUnique({
      where: { id },
    });

    if (!file) {
      throw new NotFoundException('Tevkifat dosyası bulunamadı');
    }

    if (file.status !== ApprovalStatus.PENDING) {
      throw new BadRequestException('Bu dosya zaten işlenmiş');
    }

    return this.prisma.tevkifatFile.update({
      where: { id },
      data: {
        status: ApprovalStatus.REJECTED,
      },
    });
  }

  /**
   * Şube payı hesapla (%40)
   */
  calculateBranchShare(amount: number): number {
    return amount * 0.4;
  }

  /**
   * Tevkifat merkezlerini listele
   */
  async listTevkifatCenters() {
    const centers = await this.prisma.tevkifatCenter.findMany({
      include: {
        _count: {
          select: {
            members: true,
            files: true,
          },
        },
        files: {
          orderBy: [
            { year: 'desc' },
            { month: 'desc' },
          ],
          take: 1,
          select: {
            year: true,
            month: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Şube sayısını hesapla (members üzerinden unique branch sayısı)
    return Promise.all(
      centers.map(async (center) => {
        const branchCount = await this.prisma.member.groupBy({
          by: ['branchId'],
          where: {
            tevkifatCenterId: center.id,
          },
        });

        return {
          ...center,
          branchCount: branchCount.length,
          lastTevkifatMonth: center.files[0]
            ? `${center.files[0].month}/${center.files[0].year}`
            : null,
        };
      }),
    );
  }

  /**
   * Tevkifat merkezi detayını getir
   */
  async getTevkifatCenterById(id: string) {
    const center = await this.prisma.tevkifatCenter.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            members: true,
            files: true,
            payments: true,
          },
        },
      },
    });

    if (!center) {
      throw new NotFoundException('Tevkifat merkezi bulunamadı');
    }

    // Şube sayısını hesapla
        const branchCount = await this.prisma.member.groupBy({
          by: ['branchId'],
          where: {
            tevkifatCenterId: center.id,
          },
        });

    // Aylık/yıllık özetleri hesapla
    const files = await this.prisma.tevkifatFile.findMany({
      where: {
        tevkifatCenterId: center.id,
        status: ApprovalStatus.APPROVED,
      },
      select: {
        year: true,
        month: true,
        totalAmount: true,
        memberCount: true,
      },
    });

    // Yıl bazlı özet
    const yearlySummary = files.reduce((acc, file) => {
      const year = file.year;
      if (!acc[year]) {
        acc[year] = { totalAmount: 0, memberCount: 0, monthCount: 0 };
      }
      acc[year].totalAmount += Number(file.totalAmount);
      acc[year].memberCount += file.memberCount;
      acc[year].monthCount += 1;
      return acc;
    }, {} as Record<number, { totalAmount: number; memberCount: number; monthCount: number }>);

    // Ay bazlı özet (son 12 ay)
    const monthlySummary = files
      .filter((file) => {
        const fileDate = new Date(file.year, file.month - 1);
        const twelveMonthsAgo = new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
        return fileDate >= twelveMonthsAgo;
      })
      .map((file) => ({
        year: file.year,
        month: file.month,
        totalAmount: Number(file.totalAmount),
        memberCount: file.memberCount,
      }));

    return {
      ...center,
      branchCount: branchCount.length,
      yearlySummary: Object.entries(yearlySummary).map(([year, data]) => ({
        year: Number(year),
        totalAmount: data.totalAmount,
        averageMonthlyAmount: data.monthCount > 0 ? data.totalAmount / data.monthCount : 0,
        memberCount: data.memberCount,
      })),
      monthlySummary,
    };
  }

  /**
   * Tevkifat merkezi oluştur
   */
  async createTevkifatCenter(dto: CreateTevkifatCenterDto) {
    // Kod benzersizlik kontrolü
    if (dto.code) {
      const existing = await this.prisma.tevkifatCenter.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new BadRequestException('Bu kod zaten kullanılıyor');
      }
    }

    return this.prisma.tevkifatCenter.create({
      data: {
        name: dto.name,
        code: dto.code || null,
        description: dto.description || null,
        isActive: true,
      },
    });
  }

  /**
   * Tevkifat merkezi güncelle
   */
  async updateTevkifatCenter(id: string, dto: UpdateTevkifatCenterDto) {
    const center = await this.prisma.tevkifatCenter.findUnique({
      where: { id },
    });

    if (!center) {
      throw new NotFoundException('Tevkifat merkezi bulunamadı');
    }

    // Kod benzersizlik kontrolü
    if (dto.code && dto.code !== center.code) {
      const existing = await this.prisma.tevkifatCenter.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new BadRequestException('Bu kod zaten kullanılıyor');
      }
    }

    return this.prisma.tevkifatCenter.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code || null }),
        ...(dto.description !== undefined && { description: dto.description || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /**
   * Tevkifat merkezi sil (soft delete - isActive: false)
   */
  async deleteTevkifatCenter(id: string) {
    const center = await this.prisma.tevkifatCenter.findUnique({
      where: { id },
    });

    if (!center) {
      throw new NotFoundException('Tevkifat merkezi bulunamadı');
    }

    return this.prisma.tevkifatCenter.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
