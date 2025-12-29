import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDocumentTemplateDto, UpdateDocumentTemplateDto, GenerateDocumentDto } from './dto';
import { DocumentTemplateType } from '@prisma/client';
import type { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { PdfService } from './services/pdf.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
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
    
    // Varsayılan değişkenler
    const variables: Record<string, string> = {
      firstName: member.firstName || '',
      lastName: member.lastName || '',
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
      gender: member.gender ? (member.gender === 'MALE' ? 'Erkek' : member.gender === 'FEMALE' ? 'Kadın' : 'Diğer') : '',
      educationStatus: member.educationStatus 
        ? (member.educationStatus === 'PRIMARY' ? 'İlkokul' 
           : member.educationStatus === 'HIGH_SCHOOL' ? 'Lise' 
           : member.educationStatus === 'COLLEGE' ? 'Üniversite' 
           : member.educationStatus)
        : '',
      position: '',
      workUnitAddress: '',
      // Özel değişkenler (DTO'dan gelebilir)
      ...dto.variables,
    };

    // Şablon içindeki değişkenleri değiştir
    const htmlContent = this.pdfService.replaceTemplateVariables(template.template, variables);

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
      // HTML'i PDF'e dönüştür
      await this.pdfService.generatePdfFromHtml(htmlContent, filePath, {
        format: 'A4',
        printBackground: true,
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

  // Doküman yükle
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

    // Dosya kontrolü
    if (!file) {
      throw new BadRequestException('Dosya yüklenmedi');
    }

    // Sadece PDF kabul et
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Sadece PDF dosyaları kabul edilir');
    }

    // Uploads klasörünü oluştur (yoksa)
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Dosya adını oluştur: Özel dosya adı varsa onu kullan, yoksa orijinal dosya adını kullan
    const fileExtension = '.pdf';
    let baseName: string;
    
    if (customFileName && customFileName.trim()) {
      // Özel dosya adı temizle (güvenlik için)
      baseName = customFileName.trim().replace(/[^a-zA-Z0-9_\-ğüşıöçĞÜŞİÖÇ\s]/g, '').replace(/\s+/g, '_');
    } else {
      // Orijinal dosya adını kullan
      const originalName = file.originalname || 'document.pdf';
      baseName = path.basename(originalName, path.extname(originalName) || fileExtension);
    }
    
    // Benzersiz dosya adı oluştur (aynı isimde dosya varsa üzerine yazılmasın)
    const timestamp = Date.now();
    const uniqueFileName = `${baseName}_${timestamp}${fileExtension}`;
    const filePath = path.join(uploadsDir, uniqueFileName);
    const fileUrl = `/uploads/documents/${uniqueFileName}`;

    // Dosyayı kaydet
    fs.writeFileSync(filePath, file.buffer);

    // Veritabanına kaydet
    const document = await this.prisma.memberDocument.create({
      data: {
        memberId,
        templateId: null, // Yüklenen dosya için şablon yok
        documentType: documentType || 'UPLOADED',
        fileName: uniqueFileName,
        fileUrl,
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

    return document;
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

    // Dosya yolunu oluştur
    const filePath = path.join(process.cwd(), 'uploads', 'documents', document.fileName);

    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Dosya bulunamadı: ${document.fileName}`);
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

    // Dosya yolunu oluştur
    const filePath = path.join(process.cwd(), 'uploads', 'documents', document.fileName);

    // Dosyanın var olup olmadığını kontrol et
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Dosya bulunamadı: ${document.fileName}`);
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
