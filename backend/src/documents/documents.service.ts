import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';
import { CreateDocumentTemplateDto, UpdateDocumentTemplateDto, GenerateDocumentDto } from './dto';
import { DocumentTemplateType, DocumentUploadStatus } from '@prisma/client';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { PdfService } from './services/pdf.service';
import { FileStorageService } from './services/file-storage.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private fileStorageService: FileStorageService,
    private configService: ConfigService,
  ) {}

  // Şablonlar
  async findAllTemplates() {
    return this.prisma.documentTemplate.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findTemplateById(id: string) {
    const template = await this.prisma.documentTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      throw new NotFoundException(`Şablon bulunamadı: ${id}`);
    }

    return template;
  }

  async createTemplate(dto: CreateDocumentTemplateDto) {
    return this.prisma.documentTemplate.create({
      data: {
        name: dto.name,
        description: dto.description,
        template: dto.template,
        type: dto.type,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async updateTemplate(id: string, dto: UpdateDocumentTemplateDto) {
    await this.findTemplateById(id);

    return this.prisma.documentTemplate.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.template && { template: dto.template }),
        ...(dto.type && { type: dto.type }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteTemplate(id: string) {
    await this.findTemplateById(id);

    // Soft delete - isActive false yap
    return this.prisma.documentTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // Üye dokümanları
  async findMemberDocuments(memberId: string) {
    // Önce üyenin var olup olmadığını kontrol et
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException(`Üye bulunamadı: ${memberId}`);
    }

    return this.prisma.memberDocument.findMany({
      where: {
        memberId,
        deletedAt: null,
      },
      include: {
        template: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
          },
        },
        generatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // PDF oluştur (şimdilik basit bir implementasyon)
  async generateDocument(dto: GenerateDocumentDto, generatedBy: string) {
    // Şablonu al
    const template = await this.findTemplateById(dto.templateId);

    // Üyeyi al
    const member = await this.prisma.member.findUnique({
      where: { id: dto.memberId },
      include: {
        province: true,
        district: true,
        institution: true,
        branch: true,
        membershipInfoOption: true,
        memberGroup: true,
      },
    });

    if (!member) {
      throw new NotFoundException(`Üye bulunamadı: ${dto.memberId}`);
    }

    // Tarih formatları
    const now = new Date();
    const joinDate = member.approvedAt 
      ? new Date(member.approvedAt).toLocaleDateString('tr-TR')
      : member.createdAt 
        ? new Date(member.createdAt).toLocaleDateString('tr-TR')
        : '';
    const birthDate = member.birthDate ? new Date(member.birthDate).toLocaleDateString('tr-TR') : '';
    const boardDecisionDate = member.boardDecisionDate ? new Date(member.boardDecisionDate).toLocaleDateString('tr-TR') : '';
    
    // Varsayılan değişkenler
    const variables: Record<string, string> = {
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      fullName: `${member.firstName || ''} ${member.lastName || ''}`.trim(),
      memberNumber: member.registrationNumber || '',
      nationalId: member.nationalId || '',
      phone: member.phone || '',
      email: member.email || '',
      province: member.province?.name || '',
      district: member.district?.name || '',
      institution: member.institution?.name || '',
      branch: member.branch?.name || '',
      date: now.toLocaleDateString('tr-TR'),
      joinDate: joinDate,
      applicationDate: member.createdAt 
        ? new Date(member.createdAt).toLocaleDateString('tr-TR')
        : '',
      validUntil: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toLocaleDateString('tr-TR'),
      birthPlace: member.birthplace || '',
      birthDate: birthDate,
      motherName: member.motherName || '',
      fatherName: member.fatherName || '',
      gender: member.gender ? (member.gender === 'MALE' ? 'Erkek' : member.gender === 'FEMALE' ? 'Kadın' : 'Diğer') : '',
      educationStatus: member.educationStatus 
        ? (member.educationStatus === 'PRIMARY' ? 'İlkokul' 
           : member.educationStatus === 'HIGH_SCHOOL' ? 'Lise' 
           : member.educationStatus === 'COLLEGE' ? 'Üniversite' 
           : member.educationStatus)
        : '',
      position: '',
      workUnitAddress: '',
      dutyUnit: member.dutyUnit || '',
      institutionAddress: member.institutionAddress || '',
      boardDecisionDate: boardDecisionDate,
      boardDecisionBookNo: member.boardDecisionBookNo || '',
      membershipInfoOption: member.membershipInfoOption?.label || '',
      memberGroup: member.memberGroup?.name || '',
      // Nakil belgesi için ekstra değişkenler (DTO'dan gelmeli)
      oldProvince: '',
      oldDistrict: '',
      oldInstitution: '',
      oldBranch: '',
      transferReason: '',
      // Özel değişkenler (DTO'dan gelebilir - üstteki boş değerleri override edebilir)
      ...dto.variables,
    };

    // Şablon içindeki değişkenleri değiştir
    let htmlContent = this.pdfService.replaceTemplateVariables(template.template, variables);
    
    // HTML wrapper ekle (eğer yoksa)
    htmlContent = this.pdfService.wrapTemplateWithHtml(htmlContent);

    // Dosya adı ve yolu oluştur
    const fileName = `${template.type}_${member.registrationNumber || member.id}_${Date.now()}.pdf`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    const filePath = path.join(uploadsDir, fileName);
    const fileUrl = `/uploads/documents/${fileName}`;

    // Uploads dizinini oluştur
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    try {
      // Antetli kağıt yolunu veritabanından çek
      const headerPaperPath = this.configService.getSystemSetting('DOCUMENT_HEADER_PAPER_PATH');
      let finalHeaderPaperPath: string | undefined;

      if (headerPaperPath) {
        // Eğer yol relative ise (uploads ile başlıyorsa), process.cwd() ile birleştir
        if (headerPaperPath.startsWith('/uploads/')) {
          finalHeaderPaperPath = path.join(process.cwd(), headerPaperPath);
        } else if (!path.isAbsolute(headerPaperPath)) {
          finalHeaderPaperPath = path.join(process.cwd(), headerPaperPath);
        } else {
          finalHeaderPaperPath = headerPaperPath;
        }

        // Dosya var mı kontrol et
        if (!fs.existsSync(finalHeaderPaperPath)) {
          this.logger.warn(`Antetli kağıt dosyası bulunamadı: ${finalHeaderPaperPath}`);
          finalHeaderPaperPath = undefined;
        }
      }

      // HTML'i PDF'e dönüştür
      await this.pdfService.generatePdfFromHtml(htmlContent, filePath, {
        format: 'A4',
        printBackground: true,
        headerPaperPath: finalHeaderPaperPath,
      });

      this.logger.log(`PDF document generated: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to generate PDF: ${error.message}`, error.stack);
      throw new BadRequestException(`PDF oluşturma hatası: ${error.message}`);
    }

    // Doküman kaydını oluştur
    const document = await this.prisma.memberDocument.create({
      data: {
        memberId: dto.memberId,
        templateId: dto.templateId,
        documentType: template.type,
        fileName,
        fileUrl,
        generatedBy,
      },
      include: {
        template: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
          },
        },
        generatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      fileUrl,
      fileName,
      document,
    };
  }

  // Doküman yükle (yeni güvenli staging sistemi)
  async uploadMemberDocument(
    memberId: string,
    file: Express.Multer.File,
    documentType: string,
    description: string | undefined,
    uploadedBy: string,
    customFileName?: string,
  ) {
    // Üyeyi kontrol et
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new NotFoundException(`Üye bulunamadı: ${memberId}`);
    }

    // Dosya validasyonu (FileStorageService ile)
    this.fileStorageService.validateFile(file);

    // Güvenli dosya adı oluştur
    const originalFileName = customFileName?.trim() || file.originalname || 'document.pdf';
    const secureFileName = this.fileStorageService.generateSecureFileName(
      originalFileName,
      file.buffer,
    );

    // Staging'e kaydet
    const stagingPath = this.fileStorageService.saveToStaging(
      file.buffer,
      secureFileName,
    );

    // Veritabanına kaydet (STAGING durumunda)
    const document = await this.prisma.memberDocument.create({
      data: {
        memberId,
        templateId: null, // Yüklenen dosya için şablon yok
        documentType: documentType || 'UPLOADED',
        fileName: originalFileName, // Orijinal dosya adı (gösterim için)
        secureFileName, // Güvenli dosya adı
        fileUrl: null, // Henüz onaylanmadı, URL yok
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadStatus: DocumentUploadStatus.STAGING,
        stagingPath,
        permanentPath: null,
        generatedBy: uploadedBy,
      },
      include: {
        template: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
          },
        },
        generatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(
      `Document uploaded to staging: ${document.id}, member: ${memberId}`,
    );

    return document;
  }

  // Admin: Dokümanı onayla (staging'den permanent'e taşı)
  async approveDocument(
    documentId: string,
    adminId: string,
    adminNote?: string,
  ) {
    const document = await this.prisma.memberDocument.findUnique({
      where: { id: documentId },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Doküman bulunamadı: ${documentId}`);
    }

    if (document.uploadStatus !== DocumentUploadStatus.STAGING) {
      throw new BadRequestException(
        `Bu doküman onaylanamaz. Mevcut durum: ${document.uploadStatus}`,
      );
    }

    if (!document.stagingPath || !document.secureFileName) {
      throw new BadRequestException('Doküman staging bilgileri eksik');
    }

    // Dosyayı staging'den permanent'e taşı
    const permanentPath = this.fileStorageService.moveToPermanent(
      document.stagingPath,
      document.secureFileName,
    );

    // File URL oluştur
    const fileUrl = this.fileStorageService.getFileUrl(permanentPath, true);

    // Veritabanını güncelle
    const updatedDocument = await this.prisma.memberDocument.update({
      where: { id: documentId },
      data: {
        uploadStatus: DocumentUploadStatus.APPROVED,
        permanentPath,
        stagingPath: null, // Staging'den taşındı
        fileUrl,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNote: adminNote || null,
        rejectionReason: null, // Onaylandı, red nedeni yok
      },
      include: {
        template: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
          },
        },
        generatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(
      `Document approved: ${documentId}, admin: ${adminId}`,
    );

    return updatedDocument;
  }

  // Admin: Dokümanı reddet (staging'den sil)
  async rejectDocument(
    documentId: string,
    adminId: string,
    rejectionReason: string,
  ) {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new BadRequestException('Red nedeni belirtilmelidir');
    }

    const document = await this.prisma.memberDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Doküman bulunamadı: ${documentId}`);
    }

    if (document.uploadStatus !== DocumentUploadStatus.STAGING) {
      throw new BadRequestException(
        `Bu doküman reddedilemez. Mevcut durum: ${document.uploadStatus}`,
      );
    }

    // Staging dosyasını sil
    if (document.stagingPath) {
      this.fileStorageService.deleteFromStaging(document.stagingPath);
    }

    // Veritabanını güncelle
    const updatedDocument = await this.prisma.memberDocument.update({
      where: { id: documentId },
      data: {
        uploadStatus: DocumentUploadStatus.REJECTED,
        stagingPath: null, // Silindi
        rejectionReason: rejectionReason.trim(),
        reviewedBy: adminId,
        reviewedAt: new Date(),
        adminNote: null,
      },
      include: {
        template: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
          },
        },
        generatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(
      `Document rejected: ${documentId}, admin: ${adminId}, reason: ${rejectionReason}`,
    );

    return updatedDocument;
  }

  // Admin: İnceleme bekleyen dokümanları getir
  async getPendingReviewDocuments() {
    return this.prisma.memberDocument.findMany({
      where: {
        uploadStatus: DocumentUploadStatus.STAGING,
        deletedAt: null,
      },
      include: {
        template: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
            nationalId: true,
          },
        },
        generatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc', // En eski önce
      },
    });
  }

  // Duruma göre dokümanları getir
  async getDocumentsByStatus(status: DocumentUploadStatus) {
    return this.prisma.memberDocument.findMany({
      where: {
        uploadStatus: status,
        deletedAt: null,
      },
      include: {
        template: true,
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            registrationNumber: true,
          },
        },
        generatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Üye onaylandığında evrak dosya isimlerini güncelle (kayıt numarası ekle)
  async updateMemberDocumentFileNames(memberId: string, registrationNumber: string) {
    // Üyeyi kontrol et
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nationalId: true,
      },
    });

    if (!member) {
      throw new NotFoundException(`Üye bulunamadı: ${memberId}`);
    }

    // Üyenin tüm evraklarını al
    const documents = await this.prisma.memberDocument.findMany({
      where: {
        memberId,
        deletedAt: null,
      },
    });

    if (documents.length === 0) {
      return; // Evrak yoksa işlem yapma
    }

    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    const updatedDocuments: Array<{ oldName: string; newName: string }> = [];

    for (const doc of documents) {
      const currentFileName = doc.fileName;
      const fileExtension = path.extname(currentFileName);
      const nameWithoutExt = path.basename(currentFileName, fileExtension);

      // Eğer dosya adında kayıt numarası zaten varsa, güncelleme
      if (nameWithoutExt.startsWith(registrationNumber + '_')) {
        continue; // Zaten güncellenmiş
      }

      // Yeni dosya adı: UyeKayidi_BelgeTipi_TC_AdSoyad
      const newFileName = `${registrationNumber}_${nameWithoutExt}${fileExtension}`;
      const oldFilePath = path.join(uploadsDir, currentFileName);
      const newFilePath = path.join(uploadsDir, newFileName);

      // Dosya sisteminde dosyayı yeniden adlandır
      if (fs.existsSync(oldFilePath)) {
        // Aynı isimde dosya varsa timestamp ekle
        let finalNewFileName = newFileName;
        if (fs.existsSync(newFilePath)) {
          const timestamp = Date.now();
          const nameWithoutExt2 = path.basename(newFileName, fileExtension);
          finalNewFileName = `${nameWithoutExt2}_${timestamp}${fileExtension}`;
        }

        const finalNewFilePath = path.join(uploadsDir, finalNewFileName);
        fs.renameSync(oldFilePath, finalNewFilePath);

        // Veritabanında dosya adını güncelle
        await this.prisma.memberDocument.update({
          where: { id: doc.id },
          data: {
            fileName: finalNewFileName,
            fileUrl: `/uploads/documents/${finalNewFileName}`,
          },
        });

        updatedDocuments.push({
          oldName: currentFileName,
          newName: finalNewFileName,
        });
      }
    }

    return {
      updatedCount: updatedDocuments.length,
      documents: updatedDocuments,
    };
  }

  // PDF görüntüle (inline)
  async viewDocument(documentId: string, res: Response): Promise<void> {
    const document = await this.prisma.memberDocument.findUnique({
      where: { id: documentId },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Doküman bulunamadı: ${documentId}`);
    }

    // Dosya yolunu belirle (staging veya permanent)
    let filePath: string;
    
    if (document.uploadStatus === DocumentUploadStatus.APPROVED && document.permanentPath) {
      // Onaylanmış dosya - permanent storage'dan
      filePath = document.permanentPath;
    } else if (document.uploadStatus === DocumentUploadStatus.STAGING && document.stagingPath) {
      // Staging'deki dosya - sadece admin görebilir (controller'da kontrol edilecek)
      filePath = document.stagingPath;
    } else {
      // Eski sistem uyumluluğu - fileName kullan
      filePath = path.join(process.cwd(), 'uploads', 'documents', document.fileName);
    }

    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Dosya bulunamadı: ${document.fileName || document.secureFileName}`);
    }

    // Content-Type header'ını ayarla (inline olarak göster)
    res.setHeader('Content-Type', 'application/pdf');
    
    // HTTP header'larında sadece ASCII karakterler kullanılabilir
    // Türkçe karakterler için ASCII-safe dosya adı oluştur
    const asciiFileName = document.fileName
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
      .replace(/[^\x00-\x7F]/g, '_') // Kalan ASCII olmayan karakterleri _ ile değiştir
      .replace(/[^a-zA-Z0-9._-]/g, '_'); // Özel karakterleri de temizle
    
    // Inline için basit bir header kullan (görüntüleme için dosya adı çok kritik değil)
    const safeAsciiFileName = asciiFileName.replace(/"/g, '').replace(/;/g, '_');
    res.setHeader('Content-Disposition', `inline; filename="${safeAsciiFileName}"`);

    // Dosyayı gönder
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Promise döndür - stream tamamlanana kadar bekle
    return new Promise<void>((resolve, reject) => {
      fileStream.on('end', () => resolve());
      fileStream.on('error', (error) => reject(error));
    });
  }

  // PDF indir
  async downloadDocument(documentId: string, res: Response): Promise<void> {
    const document = await this.prisma.memberDocument.findUnique({
      where: { id: documentId },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Doküman bulunamadı: ${documentId}`);
    }

    // Sadece onaylanmış dosyalar indirilebilir
    if (document.uploadStatus !== DocumentUploadStatus.APPROVED) {
      throw new BadRequestException(
        `Bu doküman henüz onaylanmadı. Durum: ${document.uploadStatus}`,
      );
    }

    // Dosya yolunu belirle
    let filePath: string;
    
    if (document.permanentPath) {
      filePath = document.permanentPath;
    } else {
      // Eski sistem uyumluluğu
      filePath = path.join(process.cwd(), 'uploads', 'documents', document.fileName);
    }

    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Dosya bulunamadı: ${document.fileName || document.secureFileName}`);
    }

    // Content-Type ve Content-Disposition header'larını ayarla
    res.setHeader('Content-Type', 'application/pdf');
    
    // HTTP header'larında sadece ASCII karakterler kullanılabilir
    // Türkçe karakterler için RFC 5987 formatını kullanıyoruz
    // filename: ASCII-only fallback (Türkçe karakterleri temizle)
    const asciiFileName = document.fileName
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
      .replace(/[^\x00-\x7F]/g, '_') // Kalan ASCII olmayan karakterleri _ ile değiştir
      .replace(/[^a-zA-Z0-9._-]/g, '_'); // Özel karakterleri de temizle
    
    // filename* için RFC 5987 formatında encode et
    // UTF-8'' prefix'i ile başlamalı ve encodeURIComponent kullanılmalı
    const encodedFileName = encodeURIComponent(document.fileName);
    
    // Content-Disposition header'ını oluştur
    // Sadece ASCII-safe karakterler kullanarak oluştur
    // filename: ASCII-only fallback (eski tarayıcılar için)
    // filename*: UTF-8 encoded (modern tarayıcılar için)
    // Header'da tırnak ve özel karakterler sorun çıkarabilir, bu yüzden dikkatli oluşturuyoruz
    const safeAsciiFileName = asciiFileName.replace(/"/g, '').replace(/;/g, '_');
    const contentDisposition = `attachment; filename="${safeAsciiFileName}"; filename*=UTF-8''${encodedFileName}`;
    
    // Header'ı set et
    res.setHeader('Content-Disposition', contentDisposition);

    // Dosyayı gönder
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
    // Promise döndür - stream tamamlanana kadar bekle
    return new Promise<void>((resolve, reject) => {
      fileStream.on('end', () => resolve());
      fileStream.on('error', (error) => reject(error));
    });
  }
}
