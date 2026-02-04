import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from '../documents/services/file-storage.service';
import { UploadTevkifatFileDto } from './dto/upload-tevkifat-file.dto';
import { CreateTevkifatCenterDto } from './dto/create-tevkifat-center.dto';
import { UpdateTevkifatCenterDto } from './dto/update-tevkifat-center.dto';
import {
  DeleteTevkifatCenterDto,
  MemberActionOnTevkifatCenterDelete,
} from './dto/delete-tevkifat-center.dto';
import { CreateTevkifatTitleDto } from './dto/create-tevkifat-title.dto';
import { UpdateTevkifatTitleDto } from './dto/update-tevkifat-title.dto';
import { ApprovalStatus, MemberStatus } from '@prisma/client';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Injectable()
export class AccountingService {
  private readonly logger = new Logger(AccountingService.name);

  constructor(
    private prisma: PrismaService,
    private fileStorageService: FileStorageService,
  ) {}

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
  async uploadTevkifatFile(dto: UploadTevkifatFileDto, uploadedBy: string) {
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
        tevkifatTitle: {
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
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
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
   * İl seçildiğinde o ile direkt bağlı olanları ve o ilin ilçelerine bağlı olanları gösterir
   */
  async listTevkifatCenters(filters?: {
    provinceId?: string;
    districtId?: string;
  }) {
    const where: any = {};

    // Eğer districtId verilmişse, sadece o ilçeye bağlı olanları göster
    if (filters?.districtId) {
      where.districtId = filters.districtId;
    } else if (filters?.provinceId) {
      // Eğer sadece provinceId verilmişse, o ile direkt bağlı olanları VEYA o ilin ilçelerine bağlı olanları göster
      where.OR = [
        { provinceId: filters.provinceId },
        { district: { provinceId: filters.provinceId } },
      ];
    }

    const centers = await this.prisma.tevkifatCenter.findMany({
      where,
      include: {
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
        _count: {
          select: {
            members: true,
            files: true,
          },
        },
        files: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 1,
          select: {
            year: true,
            month: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return centers.map((center) => ({
      id: center.id,
      name: center.name,
      isActive: center.isActive,
      provinceId: center.provinceId,
      districtId: center.districtId,
      province: center.province,
      district: center.district,
      createdAt: center.createdAt,
      updatedAt: center.updatedAt,
      memberCount: center._count.members,
      lastTevkifatMonth:
        center.files && center.files[0]
          ? `${center.files[0].month}/${center.files[0].year}`
          : null,
    }));
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
    const yearlySummary = files.reduce(
      (acc, file) => {
        const year = file.year;
        if (!acc[year]) {
          acc[year] = { totalAmount: 0, memberCount: 0, monthCount: 0 };
        }
        acc[year].totalAmount += Number(file.totalAmount);
        acc[year].memberCount += file.memberCount;
        acc[year].monthCount += 1;
        return acc;
      },
      {} as Record<
        number,
        { totalAmount: number; memberCount: number; monthCount: number }
      >,
    );

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
      yearlySummary: Object.entries(yearlySummary).map(([year, data]) => ({
        year: Number(year),
        totalAmount: data.totalAmount,
        averageMonthlyAmount:
          data.monthCount > 0 ? data.totalAmount / data.monthCount : 0,
        memberCount: data.memberCount,
      })),
      monthlySummary,
    };
  }

  /**
   * Tevkifat merkezi oluştur
   */
  async createTevkifatCenter(dto: CreateTevkifatCenterDto) {
    return this.prisma.tevkifatCenter.create({
      data: {
        name: dto.name,
        provinceId: dto.provinceId || null,
        districtId: dto.districtId || null,
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

    return this.prisma.tevkifatCenter.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.provinceId !== undefined && {
          provinceId: dto.provinceId || null,
        }),
        ...(dto.districtId !== undefined && {
          districtId: dto.districtId || null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /**
   * Tevkifat merkezi sil (soft delete - isActive: false)
   */
  async deleteTevkifatCenter(id: string, dto: DeleteTevkifatCenterDto) {
    // Transaction içinde tüm işlemleri yap
    return this.prisma.$transaction(async (tx) => {
      const center = await tx.tevkifatCenter.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      });

      if (!center) {
        throw new NotFoundException('Tevkifat merkezi bulunamadı');
      }

      // Üyelere göre işlem yap
      switch (dto.memberActionType) {
        case MemberActionOnTevkifatCenterDelete.REMOVE_TEVKIFAT_CENTER:
          // Üyelerin tevkifat merkezi bilgisini kaldır (tevkifatCenterId = null)
          await tx.member.updateMany({
            where: { tevkifatCenterId: id },
            data: { tevkifatCenterId: null },
          });
          break;

        case MemberActionOnTevkifatCenterDelete.TRANSFER_TO_TEVKIFAT_CENTER:
          // Üyeleri başka bir tevkifat merkezine taşı
          if (!dto.targetTevkifatCenterId) {
            throw new BadRequestException(
              'TRANSFER_TO_TEVKIFAT_CENTER seçeneği için targetTevkifatCenterId gereklidir',
            );
          }
          const targetCenter = await tx.tevkifatCenter.findUnique({
            where: { id: dto.targetTevkifatCenterId },
          });
          if (!targetCenter) {
            throw new NotFoundException('Hedef tevkifat merkezi bulunamadı');
          }
          await tx.member.updateMany({
            where: { tevkifatCenterId: id },
            data: { tevkifatCenterId: dto.targetTevkifatCenterId },
          });
          break;

        case MemberActionOnTevkifatCenterDelete.REMOVE_AND_DEACTIVATE:
          // Üyelerin tevkifat merkezi bilgisini kaldır ve pasif et
          await tx.member.updateMany({
            where: { tevkifatCenterId: id },
            data: {
              tevkifatCenterId: null,
              status: 'INACTIVE',
              isActive: false,
            },
          });
          break;

        case MemberActionOnTevkifatCenterDelete.TRANSFER_AND_DEACTIVATE:
          // Üyeleri başka bir tevkifat merkezine taşı ve pasif et
          if (!dto.targetTevkifatCenterId) {
            throw new BadRequestException(
              'TRANSFER_AND_DEACTIVATE seçeneği için targetTevkifatCenterId gereklidir',
            );
          }
          const targetCenter2 = await tx.tevkifatCenter.findUnique({
            where: { id: dto.targetTevkifatCenterId },
          });
          if (!targetCenter2) {
            throw new NotFoundException('Hedef tevkifat merkezi bulunamadı');
          }
          await tx.member.updateMany({
            where: { tevkifatCenterId: id },
            data: {
              tevkifatCenterId: dto.targetTevkifatCenterId,
              status: 'INACTIVE',
              isActive: false,
            },
          });
          break;

        case MemberActionOnTevkifatCenterDelete.TRANSFER_AND_CANCEL:
          // Üyeleri başka bir tevkifat merkezine taşı ve iptal et
          if (!dto.targetTevkifatCenterId) {
            throw new BadRequestException(
              'TRANSFER_AND_CANCEL seçeneği için targetTevkifatCenterId gereklidir',
            );
          }
          const targetCenter3 = await tx.tevkifatCenter.findUnique({
            where: { id: dto.targetTevkifatCenterId },
          });
          if (!targetCenter3) {
            throw new NotFoundException('Hedef tevkifat merkezi bulunamadı');
          }
          await tx.member.updateMany({
            where: { tevkifatCenterId: id },
            data: {
              tevkifatCenterId: dto.targetTevkifatCenterId,
              status: 'RESIGNED',
            },
          });
          break;

        default:
          throw new BadRequestException('Geçersiz memberActionType');
      }

      // Tevkifat merkezini pasif yap (soft delete)
      const updatedCenter = await tx.tevkifatCenter.update({
        where: { id },
        data: { isActive: false },
      });

      // Güncellenmiş merkezi döndür
      return updatedCenter;
    });
  }

  // Tevkifat Unvanları CRUD
  async listTevkifatTitles() {
    return this.prisma.tevkifatTitle.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getTevkifatTitleById(id: string) {
    const title = await this.prisma.tevkifatTitle.findUnique({
      where: { id },
    });

    if (!title) {
      throw new NotFoundException('Tevkifat unvanı bulunamadı');
    }

    return title;
  }

  async createTevkifatTitle(dto: CreateTevkifatTitleDto) {
    // İsim benzersizlik kontrolü
    const existing = await this.prisma.tevkifatTitle.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Bu unvan zaten mevcut');
    }

    return this.prisma.tevkifatTitle.create({
      data: {
        name: dto.name,
      },
    });
  }

  async updateTevkifatTitle(id: string, dto: UpdateTevkifatTitleDto) {
    const title = await this.prisma.tevkifatTitle.findUnique({
      where: { id },
    });

    if (!title) {
      throw new NotFoundException('Tevkifat unvanı bulunamadı');
    }

    // İsim benzersizlik kontrolü
    if (dto.name && dto.name !== title.name) {
      const existing = await this.prisma.tevkifatTitle.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new BadRequestException('Bu unvan zaten mevcut');
      }
    }

    return this.prisma.tevkifatTitle.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteTevkifatTitle(id: string) {
    const title = await this.prisma.tevkifatTitle.findUnique({
      where: { id },
    });

    if (!title) {
      throw new NotFoundException('Tevkifat unvanı bulunamadı');
    }

    // Gerçek silme (hard delete)
    return this.prisma.tevkifatTitle.delete({
      where: { id },
    });
  }

  /**
   * Tevkifat merkezi evrak yükleme
   */
  async uploadTevkifatCenterDocument(
    tevkifatCenterId: string,
    file: Express.Multer.File,
    customFileName?: string,
    description?: string,
    uploadedBy?: string,
    tevkifatTitleId?: string,
    month?: number,
    year?: number,
  ) {
    // Tevkifat merkezinin var olduğunu kontrol et
    const tevkifatCenter = await this.prisma.tevkifatCenter.findUnique({
      where: { id: tevkifatCenterId },
    });

    if (!tevkifatCenter) {
      throw new NotFoundException('Tevkifat merkezi bulunamadı');
    }

    // Tevkifat ünvanı kontrolü (opsiyonel)
    if (tevkifatTitleId) {
      const tevkifatTitle = await this.prisma.tevkifatTitle.findUnique({
        where: { id: tevkifatTitleId },
      });

      if (!tevkifatTitle) {
        throw new NotFoundException('Tevkifat ünvanı bulunamadı');
      }
    }

    if (!file || !file.buffer) {
      throw new BadRequestException(
        'Dosya yüklenmedi. Lütfen bir PDF dosyası seçin.',
      );
    }

    // Dosya validasyonu
    this.fileStorageService.validateFile(file);

    // Güvenli dosya adı oluştur (PDF uzantısı yoksa ekle)
    let originalFileName =
      customFileName?.trim() || file.originalname || 'document.pdf';
    if (!originalFileName.toLowerCase().endsWith('.pdf')) {
      originalFileName += '.pdf';
    }
    const secureFileName = this.fileStorageService.generateSecureFileName(
      originalFileName,
      file.buffer,
    );

    // Staging'e kaydet
    const stagingPath = this.fileStorageService.saveToStaging(
      file.buffer,
      secureFileName,
    );

    // Veritabanına kaydet - TevkifatFile tablosuna ekleme
    const document = await this.prisma.tevkifatFile.create({
      data: {
        tevkifatCenterId,
        tevkifatTitleId: tevkifatTitleId || null,
        totalAmount: 0, // Evrak için tutar sıfır
        memberCount: 0, // Evrak için üye sayısı sıfır
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear(),
        fileName: originalFileName,
        fileUrl: stagingPath, // Staging path
        fileSize: file.size,
        status: ApprovalStatus.APPROVED, // Evraklar otomatik onaylı
        uploadedBy: uploadedBy || 'system',
      },
      include: {
        tevkifatCenter: {
          select: {
            id: true,
            name: true,
          },
        },
        tevkifatTitle: {
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

    this.logger.log(
      `Tevkifat merkezi evrakı yüklendi: ${document.id} - ${originalFileName} (Ay: ${month || 'mevcut'}, Yıl: ${year || 'mevcut'})`,
    );

    return document;
  }

  /**
   * Tevkifat dosyası/evrakı indir
   */
  async downloadTevkifatFile(fileId: string, res: Response): Promise<void> {
    const tevkifatFile = await this.prisma.tevkifatFile.findUnique({
      where: { id: fileId },
      select: { id: true, fileName: true, fileUrl: true },
    });

    if (!tevkifatFile) {
      throw new NotFoundException('Tevkifat dosyası bulunamadı');
    }

    const filePath = tevkifatFile.fileUrl;
    if (!filePath || !fs.existsSync(filePath)) {
      throw new NotFoundException('Dosya bulunamadı');
    }

    const fileName = tevkifatFile.fileName || 'document.pdf';
    const asciiFileName = fileName
      .replace(/ğ/g, 'g')
      .replace(/Ğ/g, 'G')
      .replace(/ü/g, 'u')
      .replace(/Ü/g, 'U')
      .replace(/ş/g, 's')
      .replace(/Ş/g, 'S')
      .replace(/ı/g, 'i')
      .replace(/İ/g, 'I')
      .replace(/ö/g, 'o')
      .replace(/Ö/g, 'O')
      .replace(/ç/g, 'c')
      .replace(/Ç/g, 'C')
      .replace(/[^\x00-\x7F]/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${asciiFileName}"`,
    );
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}
