/**
 * Members Controller
 *
 * Presentation Layer: HTTP request/response handling
 *
 * Sorumluluklar:
 * - HTTP endpoint'leri tanımlama
 * - Request validation (DTO)
 * - Response mapping (Mapper kullanarak)
 * - Error handling (Exception Filter)
 */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
  Patch,
  Query,
  Res,
  UseFilters,
  UsePipes,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MembersService } from '../../members.service';
import { CreateMemberApplicationDto } from '../../application/dto/create-member-application.dto';
import { CancelMemberDto } from '../../application/dto/cancel-member.dto';
import { UpdateMemberDto } from '../../application/dto/update-member.dto';
import { ApproveMemberDto } from '../../application/dto/approve-member.dto';
import { DeleteMemberDto } from '../../application/dto/delete-member.dto';
import { Permissions } from '../../../auth/decorators/permissions.decorator';
import { Permission } from '../../../auth/permission.enum';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../../../auth/decorators/current-user.decorator';
import { PdfService } from '../../../documents/services/pdf.service';
import { MemberMapper } from '../../application/mappers/member.mapper';
import { MemberExceptionFilter } from '../filters/member-exception.filter';
import { MemberValidationPipe } from '../pipes/member-validation.pipe';

@ApiTags('Members')
@ApiBearerAuth('JWT-auth')
@Controller('members')
// @UseFilters(MemberExceptionFilter) // Global filter olarak kullanılabilir, şimdilik kapalı
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly pdfService: PdfService,
  ) {}

  @Permissions(Permission.MEMBER_CREATE_APPLICATION)
  @Get('check-national-id/:nationalId')
  @ApiOperation({
    summary: 'TC kimlik numarasına göre iptal edilmiş üye kontrolü',
    description:
      'Belirtilen TC kimlik numarasına sahip iptal edilmiş üye var mı kontrol eder',
  })
  @ApiParam({ name: 'nationalId', description: 'TC Kimlik Numarası' })
  @ApiResponse({
    status: 200,
    description: 'İptal edilmiş üye bilgisi (varsa)',
  })
  async checkNationalId(
    @Param('nationalId') nationalId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const cancelledMember =
      await this.membersService.checkCancelledMemberByNationalId(
        nationalId,
        user,
      );
    return cancelledMember;
  }

  @Permissions(Permission.MEMBER_CREATE_APPLICATION)
  @Post('applications')
  @ApiOperation({
    summary: 'Yeni üyelik başvurusu oluştur',
    description: 'Yeni bir üyelik başvurusu kaydı oluşturur',
  })
  @ApiBody({ type: CreateMemberApplicationDto })
  @ApiResponse({
    status: 201,
    description: 'Başvuru başarıyla oluşturuldu',
  })
  @UsePipes(MemberValidationPipe)
  async createApplication(
    @Body()
    dto: CreateMemberApplicationDto & { previousCancelledMemberId?: string },
    @CurrentUser() user: CurrentUserData,
  ) {
    // Service Prisma model dönüyor, şimdilik direkt döndürüyoruz
    // İleride Domain Entity döndüğünde mapper kullanılacak
    const member = await this.membersService.createApplication(
      dto,
      user.userId,
      dto.previousCancelledMemberId,
      user,
    );
    return member;
  }

  @Permissions(
    Permission.MEMBER_LIST,
    Permission.MEMBER_APPROVE,
    Permission.MEMBER_LIST_BY_PROVINCE,
  )
  @Get('applications')
  @ApiOperation({
    summary: 'Bekleyen üyelik başvurularını listele',
    description:
      "Kullanıcının yetkisi dahilindeki PENDING durumundaki başvuruları listeler. MEMBER_LIST_BY_PROVINCE izni varsa sadece role'deki il/ilçe bazlı başvuruları gösterir",
  })
  @ApiResponse({
    status: 200,
    description: 'Başvuru listesi',
    type: 'array',
  })
  async listApplications(@CurrentUser() user: CurrentUserData) {
    const applications =
      await this.membersService.listApplicationsForUser(user);
    // Prisma model'leri için mapper kullanılabilir, şimdilik direkt dönüyoruz
    return applications;
  }

  @Get('membership-info-options')
  @ApiOperation({
    summary: 'Üyelik bilgisi seçeneklerini listele',
    description: 'Aktif üyelik bilgisi seçeneklerini getirir',
  })
  @ApiResponse({
    status: 200,
    description: 'Üyelik bilgisi seçenekleri listesi',
    type: 'array',
  })
  async getMembershipInfoOptions() {
    return this.membersService.getMembershipInfoOptions();
  }

  @Permissions(Permission.MEMBER_LIST, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get()
  @ApiOperation({
    summary: 'Üye listesi',
    description:
      "Kullanıcının yetkisi dahilindeki üyeleri listeler. Status parametresi ile filtreleme yapılabilir. Varsayılan olarak ACTIVE üyeler gösterilir. MEMBER_LIST_BY_PROVINCE izni varsa sadece role'deki il/ilçe bazlı üyeleri gösterir",
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'PENDING',
      'APPROVED',
      'ACTIVE',
      'INACTIVE',
      'RESIGNED',
      'EXPELLED',
      'REJECTED',
    ],
    description: 'Üye durumu filtresi. Belirtilmezse ACTIVE üyeler gösterilir.',
  })
  @ApiQuery({
    name: 'provinceId',
    required: false,
    description:
      'İl filtresi. Verilirse üyenin ili, şubenin ili veya kurumun ili bu il olan üyeler döner.',
  })
  @ApiResponse({
    status: 200,
    description: 'Üye listesi',
    type: 'array',
  })
  async listMembers(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: string,
    @Query('provinceId') provinceId?: string,
  ) {
    const members = await this.membersService.listMembersForUser(
      user,
      status as any,
      provinceId,
    );
    return members;
  }

  @Permissions(Permission.MEMBER_LIST, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get('rejected')
  @ApiOperation({
    summary: 'Reddedilen üyeleri listele',
    description:
      "Kullanıcının yetkisi dahilindeki reddedilen üyeleri listeler. MEMBER_LIST_BY_PROVINCE izni varsa sadece role'deki il/ilçe bazlı reddedilen üyeleri gösterir",
  })
  @ApiResponse({
    status: 200,
    description: 'Reddedilen üye listesi',
    type: 'array',
  })
  async listRejectedMembers(@CurrentUser() user: CurrentUserData) {
    return this.membersService.listRejectedMembersForUser(user);
  }

  @Permissions(Permission.MEMBER_LIST, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get('cancelled')
  @ApiOperation({
    summary: 'İptal edilen üyeleri listele',
    description:
      "Üyeliği iptal edilmiş üyeleri listeler. MEMBER_LIST_BY_PROVINCE izni varsa sadece role'deki il/ilçe bazlı iptal edilen üyeleri gösterir",
  })
  @ApiResponse({ status: 200, description: 'İptal edilen üyeler listesi' })
  async listCancelledMembers(@CurrentUser() user: CurrentUserData) {
    return this.membersService.listCancelledMembersForUser(user);
  }

  @Permissions(
    Permission.MEMBER_LIST,
    Permission.MEMBER_APPROVE,
    Permission.MEMBER_LIST_BY_PROVINCE,
  )
  @Get('approved')
  @ApiOperation({
    summary: 'Onaylanmış (beklemede) üyeleri listele',
    description:
      'Kullanıcının yetkisi dahilindeki APPROVED durumundaki üyeleri listeler',
  })
  @ApiResponse({
    status: 200,
    description: 'Onaylanmış üye listesi',
    type: 'array',
  })
  async listApprovedMembers(@CurrentUser() user: CurrentUserData) {
    return this.membersService.listApprovedMembersForUser(user);
  }

  @Permissions(Permission.MEMBER_VIEW)
  @Get(':id')
  @ApiOperation({
    summary: 'Üye detayını getir',
    description: 'ID ile üye bilgilerini getirir',
  })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Üye bilgileri',
  })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  async getById(@Param('id') id: string) {
    const member = await this.membersService.getById(id);
    // Prisma model dönüyor, mapper kullanılabilir ama şimdilik direkt dönüyoruz
    return member;
  }

  @Permissions(Permission.MEMBER_APPROVE)
  @Post(':id/approve')
  @ApiOperation({
    summary: 'Üyelik başvurusunu onayla',
    description:
      'PENDING durumundaki başvuruyu onaylar ve APPROVED durumuna geçirir. Üye bekleyen üyeler listesine eklenir.',
  })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiBody({ type: ApproveMemberDto, required: false })
  @ApiResponse({
    status: 200,
    description:
      'Başvuru onaylandı ve üye APPROVED durumuna geçirildi (bekleyen üyeler listesine eklendi)',
  })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  @UsePipes(MemberValidationPipe)
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveMemberDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const member = await this.membersService.approve(id, user.userId, dto);
    // Prisma model dönüyor, mapper kullanılabilir ama şimdilik direkt dönüyoruz
    return member;
  }

  @Permissions(Permission.MEMBER_REJECT)
  @Post(':id/reject')
  @ApiOperation({
    summary: 'Üyelik başvurusunu reddet',
    description: 'PENDING durumundaki başvuruyu REJECTED yapar',
  })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Başvuru reddedildi',
  })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  async reject(@Param('id') id: string, @CurrentUser() user: CurrentUserData) {
    const member = await this.membersService.reject(id, user.userId);
    return member;
  }

  @Permissions(Permission.MEMBER_APPROVE)
  @Post(':id/activate')
  @ApiOperation({
    summary: 'Onaylanmış üyeyi aktifleştir',
    description: 'APPROVED durumundaki üyeyi ACTIVE yapar',
  })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Üye aktifleştirildi',
  })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  @ApiResponse({
    status: 400,
    description: 'Üye onaylanmış (APPROVED) durumunda değil',
  })
  async activate(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const member = await this.membersService.activate(id, user.userId);
    return member;
  }

  @Permissions(Permission.MEMBER_STATUS_CHANGE)
  @Delete(':id')
  @ApiOperation({
    summary: 'Üyeyi sil',
    description: 'Üyeyi soft delete yapar',
  })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiBody({ type: DeleteMemberDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'Üye silindi',
  })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  @UsePipes(MemberValidationPipe)
  async softDelete(@Param('id') id: string, @Body() dto?: DeleteMemberDto) {
    return this.membersService.softDelete(id, dto);
  }

  @Permissions(Permission.MEMBER_STATUS_CHANGE)
  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Üyeliği iptal et',
    description: 'Aktif bir üyenin üyeliğini iptal eder',
  })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiBody({ type: CancelMemberDto })
  @ApiResponse({ status: 200, description: 'Üyelik başarıyla iptal edildi' })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  @ApiResponse({ status: 400, description: 'Geçersiz işlem' })
  @UsePipes(MemberValidationPipe)
  async cancelMembership(
    @Param('id') id: string,
    @Body() dto: CancelMemberDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const member = await this.membersService.cancelMembership(
      id,
      dto,
      user.userId,
    );
    return member;
  }

  @Permissions(Permission.MEMBER_UPDATE)
  @Patch(':id')
  @ApiOperation({
    summary: 'Üye bilgilerini güncelle',
    description: 'Üye bilgilerini günceller ve geçmişe kaydeder',
  })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiBody({ type: UpdateMemberDto })
  @ApiResponse({ status: 200, description: 'Üye bilgileri güncellendi' })
  @ApiResponse({ status: 404, description: 'Üye bulunamadı' })
  @UsePipes(MemberValidationPipe)
  async updateMember(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    // TODO: IP adresi ve user agent bilgisini request'ten al
    const member = await this.membersService.updateMember(id, dto, user.userId);
    return member;
  }

  @Permissions(Permission.MEMBER_VIEW)
  @Get(':id/history')
  @ApiOperation({ summary: 'Üye güncelleme geçmişini getir' })
  @ApiParam({ name: 'id', description: 'Üye ID', example: 'member-uuid-123' })
  @ApiResponse({ status: 200, description: 'Üye güncelleme geçmişi' })
  async getMemberHistory(@Param('id') id: string) {
    return this.membersService.getMemberHistory(id);
  }

  @Permissions(Permission.MEMBER_LIST, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get('export/pdf')
  @ApiOperation({ summary: 'Üyeleri PDF olarak export et' })
  @ApiResponse({ status: 200, description: 'PDF dosyası indiriliyor' })
  async exportMembersToPdf(
    @Res() res: Response,
    @CurrentUser() user: CurrentUserData,
  ) {
    const members = await this.membersService.listMembersForUser(user);

    // HTML içeriği oluştur
    const htmlContent = this.generateMembersHtml(members);

    // PDF oluştur
    const pdfBuffer =
      await this.pdfService.generatePdfBufferFromHtml(htmlContent);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=uyeler_${new Date().toISOString().split('T')[0]}.pdf`,
    );
    res.send(pdfBuffer);
  }

  @Permissions(Permission.MEMBER_VIEW)
  @Get(':id/export/pdf')
  @ApiOperation({ summary: 'Üye detayını PDF olarak export et' })
  @ApiParam({ name: 'id', description: 'Üye ID' })
  @ApiResponse({ status: 200, description: 'PDF dosyası indiriliyor' })
  async exportMemberDetailToPdf(@Param('id') id: string, @Res() res: Response) {
    const member = await this.membersService.getById(id);

    // HTML içeriği oluştur
    const htmlContent = this.generateMemberDetailHtml(member);

    // PDF oluştur
    const pdfBuffer =
      await this.pdfService.generatePdfBufferFromHtml(htmlContent);

    const fileName = `uye_${member.firstName}_${member.lastName}_${member.id.substring(0, 8)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(pdfBuffer);
  }

  private generateMembersHtml(members: any[]): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const getStatusLabel = (status: string) => {
      const statusMap: Record<string, string> = {
        PENDING: 'Onay Bekliyor',
        ACTIVE: 'Aktif',
        INACTIVE: 'Pasif',
        RESIGNED: 'İstifa Etmiş',
        EXPELLED: 'İhraç Edilmiş',
        REJECTED: 'Reddedilmiş',
      };
      return statusMap[status] || status;
    };

    const rows = members
      .map((member) => {
        const firstName = member.firstName || '';
        const lastName = member.lastName || '';
        const phone = member.phone || '-';
        const email = member.email || '-';
        const nationalId = member.nationalId || '-';
        const registrationNumber = member.registrationNumber || '-';
        const province = member.province?.name || '-';
        const district = member.district?.name || '-';
        const status = getStatusLabel(member.status);
        const positionTitle = '-';

        return `
        <tr>
          <td>${firstName}</td>
          <td>${lastName}</td>
          <td>${phone}</td>
          <td>${email}</td>
          <td>${nationalId}</td>
          <td>${registrationNumber}</td>
          <td>${province}</td>
          <td>${district}</td>
          <td>${status}</td>
          <td>${positionTitle}</td>
        </tr>
      `;
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Üyeler Listesi</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            color: #333;
            padding: 20px;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 15px;
          }
          .header h1 {
            color: #1976d2;
            font-size: 20px;
            margin-bottom: 8px;
          }
          .header .date {
            color: #666;
            font-size: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 9px;
          }
          th {
            background-color: #1976d2;
            color: white;
            padding: 8px 4px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #ddd;
          }
          td {
            padding: 6px 4px;
            border: 1px solid #ddd;
            word-wrap: break-word;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
          }
          tr:hover {
            background-color: #f5f5f5;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Üyeler Listesi</h1>
          <div class="date">Tarih: ${dateStr}</div>
          <div class="date">Toplam Üye: ${members.length}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Ad</th>
              <th>Soyad</th>
              <th>Telefon</th>
              <th>Email</th>
              <th>TC Kimlik</th>
              <th>Üye No</th>
              <th>İl</th>
              <th>İlçe</th>
              <th>Durum</th>
              <th>Pozisyon</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="footer">
          Bu rapor ${dateStr} tarihinde oluşturulmuştur.
        </div>
      </body>
      </html>
    `;
  }

  private generateMemberDetailHtml(member: any): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const getStatusLabel = (status: string) => {
      const statusMap: Record<string, string> = {
        PENDING: 'Onay Bekliyor',
        ACTIVE: 'Aktif',
        INACTIVE: 'Pasif',
        RESIGNED: 'İstifa Etmiş',
        EXPELLED: 'İhraç Edilmiş',
        REJECTED: 'Reddedilmiş',
      };
      return statusMap[status] || status;
    };

    const getGenderLabel = (gender: string) => {
      if (gender === 'MALE') return 'Erkek';
      if (gender === 'FEMALE') return 'Kadın';
      return gender || '-';
    };

    const getEducationLabel = (education: string) => {
      if (education === 'COLLEGE') return 'Yüksekokul';
      if (education === 'HIGH_SCHOOL') return 'Lise';
      if (education === 'PRIMARY') return 'İlköğretim';
      return education || '-';
    };

    const formatDate = (date: string | Date | null | undefined) => {
      if (!date) return '-';
      try {
        const d = typeof date === 'string' ? new Date(date) : date;
        return d.toLocaleDateString('tr-TR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        return '-';
      }
    };

    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Üye Detayı - ${member.firstName} ${member.lastName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', sans-serif;
            font-size: 10px;
            color: #333;
            padding: 20px;
            line-height: 1.5;
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 3px solid #1976d2;
            padding-bottom: 15px;
          }
          .header h1 {
            color: #1976d2;
            font-size: 22px;
            margin-bottom: 8px;
          }
          .header .subtitle {
            color: #666;
            font-size: 12px;
            margin-bottom: 3px;
          }
          .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          .section-title {
            background-color: #1976d2;
            color: white;
            padding: 8px 12px;
            font-size: 12px;
            font-weight: bold;
            margin-bottom: 10px;
            border-radius: 4px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1.2fr 2fr;
            gap: 8px;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #555;
            font-size: 9.5px;
          }
          .info-value {
            color: #333;
            font-size: 9.5px;
            word-wrap: break-word;
          }
          .footer {
            margin-top: 25px;
            text-align: center;
            font-size: 9px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Üye Detay Raporu</h1>
          <div class="subtitle">${member.firstName} ${member.lastName}</div>
          <div class="subtitle">Tarih: ${dateStr}</div>
        </div>

        <div class="section">
          <div class="section-title">Kişisel Bilgiler</div>
          <div class="info-grid">
            <div class="info-label">Ad:</div>
            <div class="info-value">${member.firstName || '-'}</div>
            <div class="info-label">Soyad:</div>
            <div class="info-value">${member.lastName || '-'}</div>
            <div class="info-label">TC Kimlik No:</div>
            <div class="info-value">${member.nationalId || '-'}</div>
            <div class="info-label">Üye Numarası:</div>
            <div class="info-value">${member.registrationNumber || '-'}</div>
            <div class="info-label">Anne Adı:</div>
            <div class="info-value">${member.motherName || '-'}</div>
            <div class="info-label">Baba Adı:</div>
            <div class="info-value">${member.fatherName || '-'}</div>
            <div class="info-label">Doğum Tarihi:</div>
            <div class="info-value">${formatDate(member.birthDate)}</div>
            <div class="info-label">Doğum Yeri:</div>
            <div class="info-value">${member.birthplace || '-'}</div>
            <div class="info-label">Cinsiyet:</div>
            <div class="info-value">${getGenderLabel(member.gender)}</div>
            <div class="info-label">Öğrenim Durumu:</div>
            <div class="info-value">${getEducationLabel(member.educationStatus)}</div>
            <div class="info-label">Telefon:</div>
            <div class="info-value">${member.phone || '-'}</div>
            <div class="info-label">E-posta:</div>
            <div class="info-value">${member.email || '-'}</div>
            <div class="info-label">İl (Kayıtlı Olduğu Yer):</div>
            <div class="info-value">${member.province?.name || '-'}</div>
            <div class="info-label">İlçe (Kayıtlı Olduğu Yer):</div>
            <div class="info-value">${member.district?.name || '-'}</div>
            <div class="info-label">Üyelik Durumu:</div>
            <div class="info-value">${getStatusLabel(member.status)}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Kurum Bilgileri</div>
          <div class="info-grid">
            <div class="info-label">Kurum Adı:</div>
            <div class="info-value">${member.institution?.name || '-'}</div>
            <div class="info-label">Görev Birimi:</div>
            <div class="info-value">${member.dutyUnit || '-'}</div>
            <div class="info-label">Kurum Adresi:</div>
            <div class="info-value">${member.institutionAddress || '-'}</div>
            <div class="info-label">Kurum İli:</div>
            <div class="info-value">${member.institutionProvince?.name || '-'}</div>
            <div class="info-label">Kurum İlçesi:</div>
            <div class="info-value">${member.institutionDistrict?.name || '-'}</div>
            <div class="info-label">Meslek/Unvan:</div>
            <div class="info-value">${member.profession?.name || '-'}</div>
            <div class="info-label">Kurum Sicil No:</div>
            <div class="info-value">${member.institutionRegNo || '-'}</div>
            <div class="info-label">Kadro Unvan Kodu:</div>
            <div class="info-value">${member.staffTitleCode || '-'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Şube Bilgileri</div>
          <div class="info-grid">
            <div class="info-label">Şube:</div>
            <div class="info-value">${member.branch?.name || '-'}${member.branch?.code ? ` (${member.branch.code})` : ''}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Tevkifat Bilgileri</div>
          <div class="info-grid">
            <div class="info-label">Tevkifat Kurumu:</div>
            <div class="info-value">${member.tevkifatCenter?.name || '-'}</div>
            <div class="info-label">Tevkifat Ünvanı:</div>
            <div class="info-value">${member.tevkifatTitle?.name || '-'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Üyelik Bilgileri</div>
          <div class="info-grid">
            <div class="info-label">Üye Grubu:</div>
            <div class="info-value">${member.membershipInfoOption?.label || '-'}</div>
            <div class="info-label">Yönetim Karar Defteri No:</div>
            <div class="info-value">${member.boardDecisionBookNo || '-'}</div>
            <div class="info-label">Yönetim Kurulu Karar Tarihi:</div>
            <div class="info-value">${formatDate(member.boardDecisionDate)}</div>
          </div>
        </div>

        <div class="footer">
          Bu rapor ${dateStr} tarihinde oluşturulmuştur.
        </div>
      </body>
      </html>
    `;
  }
}
