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
import * as fs from 'fs';
import * as path from 'path';
import type { Response } from 'express';

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
        isApproved: true, // Otomatik olarak onaylanmış olarak kaydedilir
        approvedByUserId: createdBy,
        approvedAt: new Date(),
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

  /**
   * Ödeme için dosya yükle
   */
  async uploadPaymentDocument(
    file: Express.Multer.File,
    memberId: string,
    paymentPeriodMonth: number,
    paymentPeriodYear: number,
    customFileName?: string,
  ) {
    // Dosya kontrolü
    if (!file) {
      throw new BadRequestException('Dosya yüklenmedi');
    }

    // Sadece PDF kabul et
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Sadece PDF dosyaları kabul edilir');
    }

    // Üyeyi kontrol et
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        registrationNumber: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Üye bulunamadı');
    }

    // Uploads klasörünü oluştur (yoksa)
    const uploadsDir = path.join(process.cwd(), 'uploads', 'payments');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Dosya adını oluştur
    let fileName: string;
    
    if (customFileName && customFileName.trim()) {
      // Özel dosya adı varsa onu kullan
      const cleanedName = customFileName.trim().replace(/[^a-zA-Z0-9_\-ğüşıöçĞÜŞİÖÇ\s\.]/g, '').replace(/\s+/g, '_');
      // Uzantıyı kontrol et, yoksa .pdf ekle
      const hasExtension = path.extname(cleanedName);
      if (hasExtension) {
        fileName = cleanedName;
      } else {
        fileName = `${cleanedName}.pdf`;
      }
    } else {
      // Otomatik dosya adı oluştur: Odeme_[UyeAdi]_[AyYil]_[Tarih].pdf
      const monthNames = [
        'Ocak', 'Subat', 'Mart', 'Nisan', 'Mayis', 'Haziran',
        'Temmuz', 'Agustos', 'Eylul', 'Ekim', 'Kasim', 'Aralik'
      ];
      const monthName = monthNames[paymentPeriodMonth - 1] || `Ay${paymentPeriodMonth}`;
      
      // Üye adını temizle (Türkçe karakterleri koru, özel karakterleri kaldır)
      const memberName = `${member.firstName}_${member.lastName}`
        .replace(/[^a-zA-Z0-9_ğüşıöçĞÜŞİÖÇ]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50); // Maksimum 50 karakter
      
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const timestamp = Date.now();
      
      fileName = `Odeme_${memberName}_${monthName}${paymentPeriodYear}_${dateStr}_${timestamp}.pdf`;
    }
    
    const filePath = path.join(uploadsDir, fileName);
    const fileUrl = `/uploads/payments/${fileName}`;

    // Dosyayı kaydet
    fs.writeFileSync(filePath, file.buffer);

    return {
      fileUrl,
      fileName,
    };
  }

  /**
   * Ödeme belgesi görüntüle (inline)
   */
  async viewPaymentDocument(paymentId: string, res: Response): Promise<void> {
    const payment = await this.prisma.memberPayment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        documentUrl: true,
        memberId: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Ödeme kaydı bulunamadı: ${paymentId}`);
    }

    if (!payment.documentUrl) {
      throw new NotFoundException('Bu ödeme için belge bulunamadı');
    }

    // documentUrl formatı: /uploads/payments/fileName.pdf
    // Dosya yolunu oluştur
    const fileName = payment.documentUrl.split('/').pop() || 'document.pdf';
    const filePath = path.join(process.cwd(), 'uploads', 'payments', fileName);

    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Dosya bulunamadı: ${fileName}`);
    }

    // Content-Type header'ını ayarla (inline olarak göster)
    res.setHeader('Content-Type', 'application/pdf');
    
    // HTTP header'larında sadece ASCII karakterler kullanılabilir
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
    
    const safeAsciiFileName = asciiFileName.replace(/"/g, '').replace(/;/g, '_');
    res.setHeader('Content-Disposition', `inline; filename="${safeAsciiFileName}"`);

    // Dosyayı gönder
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    return new Promise<void>((resolve, reject) => {
      fileStream.on('end', () => resolve());
      fileStream.on('error', (error) => reject(error));
    });
  }

  /**
   * Ödeme belgesi indir
   */
  async downloadPaymentDocument(paymentId: string, res: Response): Promise<void> {
    const payment = await this.prisma.memberPayment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        documentUrl: true,
        memberId: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Ödeme kaydı bulunamadı: ${paymentId}`);
    }

    if (!payment.documentUrl) {
      throw new NotFoundException('Bu ödeme için belge bulunamadı');
    }

    // documentUrl formatı: /uploads/payments/fileName.pdf
    const fileName = payment.documentUrl.split('/').pop() || 'payment-document.pdf';
    const filePath = path.join(process.cwd(), 'uploads', 'payments', fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Dosya bulunamadı: ${fileName}`);
    }

    // Content-Type header'ını ayarla
    res.setHeader('Content-Type', 'application/pdf');
    
    // ASCII-safe dosya adı oluştur
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
    
    // UTF-8 encoding ile dosya adını ayarla (RFC 5987)
    const safeAsciiFileName = asciiFileName.replace(/"/g, '').replace(/;/g, '_');
    const encodedFileName = encodeURIComponent(fileName).replace(/'/g, '%27');
    res.setHeader('Content-Disposition', `attachment; filename="${safeAsciiFileName}"; filename*=UTF-8''${encodedFileName}`);

    // Dosyayı gönder
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    return new Promise<void>((resolve, reject) => {
      fileStream.on('end', () => resolve());
      fileStream.on('error', (error) => reject(error));
    });
  }
}
