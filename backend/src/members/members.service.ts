import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberApplicationDto } from './dto/create-member-application.dto';
import { CancelMemberDto } from './dto/cancel-member.dto';
import { MemberStatus, MemberSource } from '@prisma/client';
import { MemberScopeService } from './member-scope.service';
import { MemberHistoryService } from './member-history.service';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { UpdateMemberDto } from './dto/update-member.dto';
import { DeleteMemberDto } from './dto/delete-member.dto';
import { ConfigService } from '../config/config.service';
import { DocumentsService } from '../documents/documents.service';
import { forwardRef, Inject } from '@nestjs/common';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private prisma: PrismaService,
    private scopeService: MemberScopeService,
    private historyService: MemberHistoryService,
    private configService: ConfigService,
    @Inject(forwardRef(() => DocumentsService))
    private documentsService: DocumentsService,
  ) {}

  /**
   * Aktif üyelik bilgisi seçeneklerini getir
   */
  async getMembershipInfoOptions() {
    return this.prisma.membershipInfoOption.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        order: 'asc',
      },
      select: {
        id: true,
        label: true,
        value: true,
        description: true,
      },
    });
  }

  private validateNationalIdOrThrow(nationalId: string) {
    const cleaned = nationalId?.trim() || '';
    if (!cleaned) {
      throw new BadRequestException('TC Kimlik Numarası zorunludur');
    }
    if (!/^\d{11}$/.test(cleaned)) {
      throw new BadRequestException('TC Kimlik Numarası 11 haneli ve sadece rakam olmalıdır');
    }
  }

  /**
   * Sistem ayarlarına göre zorunlu alanları kontrol et
   */
  private validateRequiredFields(dto: CreateMemberApplicationDto, provinceId?: string, districtId?: string) {
    // İkamet il/ilçe kontrolü (özel kontrol çünkü scope'dan da gelebilir)
    if (this.configService.getSystemSettingBoolean('MEMBERSHIP_REQUIRE_PROVINCE_DISTRICT', false)) {
      const finalProvinceId = provinceId || dto.provinceId;
      const finalDistrictId = districtId || dto.districtId;
      if (!finalProvinceId || !finalDistrictId) {
        throw new BadRequestException('İkamet il ve ilçe alanları zorunludur');
      }
    }

    const requiredFields = [
      { key: 'MEMBERSHIP_REQUIRE_MOTHER_NAME', field: 'motherName', label: 'Anne adı' },
      { key: 'MEMBERSHIP_REQUIRE_FATHER_NAME', field: 'fatherName', label: 'Baba adı' },
      { key: 'MEMBERSHIP_REQUIRE_BIRTHPLACE', field: 'birthplace', label: 'Doğum yeri' },
      { key: 'MEMBERSHIP_REQUIRE_GENDER', field: 'gender', label: 'Cinsiyet' },
      { key: 'MEMBERSHIP_REQUIRE_EDUCATION', field: 'educationStatus', label: 'Öğrenim durumu' },
      { key: 'MEMBERSHIP_REQUIRE_PHONE', field: 'phone', label: 'Telefon' },
      { key: 'MEMBERSHIP_REQUIRE_EMAIL', field: 'email', label: 'E-posta' },
      { key: 'MEMBERSHIP_REQUIRE_INSTITUTION_REG_NO', field: 'institutionRegNo', label: 'Kurum sicil no' },
      { key: 'MEMBERSHIP_REQUIRE_WORK_UNIT', field: 'workUnit', label: 'Görev yaptığı birim' },
    ];

    for (const { key, field, label } of requiredFields) {
      const isRequired = this.configService.getSystemSettingBoolean(key, false);
      if (isRequired) {
        const value = dto[field as keyof CreateMemberApplicationDto];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          throw new BadRequestException(`${label} alanı zorunludur`);
        }
      }
    }
  }

  /**
   * Sistem ayarlarına göre kayıt numarası oluştur
   */
  private async generateRegistrationNumber(): Promise<string> {
    const autoGenerate = this.configService.getSystemSettingBoolean('MEMBERSHIP_AUTO_GENERATE_REG_NUMBER', false);
    if (!autoGenerate) {
      // Otomatik oluşturma kapalıysa geçici bir değer döndür
      return `TEMP-${Date.now()}`;
    }

    const format = this.configService.getSystemSetting('MEMBERSHIP_REG_NUMBER_FORMAT', 'SEQUENTIAL');
    const prefix = (this.configService.getSystemSetting('MEMBERSHIP_REG_NUMBER_PREFIX', '') ?? '').trim();
    const startNumber = this.configService.getSystemSettingNumber('MEMBERSHIP_REG_NUMBER_START', 1);
    const currentYear = new Date().getFullYear();

    // Format'a göre expected pattern oluştur
    let expectedPattern: string;
    switch (format) {
      case 'SEQUENTIAL':
        expectedPattern = '^\\d+$';
        break;
      case 'YEAR_SEQUENTIAL':
        expectedPattern = `^${currentYear}-\\d+$`;
        break;
      case 'PREFIX_SEQUENTIAL':
        expectedPattern = prefix ? `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d+$` : '^\\d+$';
        break;
      case 'PREFIX_YEAR_SEQUENTIAL':
        expectedPattern = prefix
          ? `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-${currentYear}-\\d+$`
          : `^${currentYear}-\\d+$`;
        break;
      default:
        expectedPattern = '^\\d+$';
    }

    // En son kayıt numarasını bul (geçici numaralar hariç, format'a uygun olanlar)
    const allMembers = await this.prisma.member.findMany({
      where: {
        registrationNumber: {
          not: {
            startsWith: 'TEMP-',
          },
        },
      },
      select: {
        registrationNumber: true,
      },
    });

    const regex = new RegExp(expectedPattern);
    let maxNumber = startNumber - 1;

    for (const member of allMembers) {
      if (member.registrationNumber && regex.test(member.registrationNumber)) {
        // Son numarayı çıkar
        const numberMatch = member.registrationNumber.match(/(\d+)$/);
        if (numberMatch) {
          const num = parseInt(numberMatch[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }

    const nextNumber = maxNumber + 1;

    switch (format) {
      case 'SEQUENTIAL':
        return `${nextNumber}`;
      case 'YEAR_SEQUENTIAL':
        return `${currentYear}-${String(nextNumber).padStart(3, '0')}`;
      case 'PREFIX_SEQUENTIAL':
        return prefix ? `${prefix}-${String(nextNumber).padStart(3, '0')}` : `${nextNumber}`;
      case 'PREFIX_YEAR_SEQUENTIAL':
        return prefix
          ? `${prefix}-${currentYear}-${String(nextNumber).padStart(3, '0')}`
          : `${currentYear}-${String(nextNumber).padStart(3, '0')}`;
      default:
        return `${nextNumber}`;
    }
  }

  /**
   * Başvuru kaynağının izinli olup olmadığını kontrol et
   */
  private validateAllowedSource(source: MemberSource) {
    const allowedSourcesStr = this.configService.getSystemSetting('MEMBERSHIP_ALLOWED_SOURCES', '');
    const allowedSources = allowedSourcesStr
      ? allowedSourcesStr.split(',').map((s) => s.trim()).filter((s) => s !== '')
      : [];

    // Eğer hiçbir kaynak belirtilmemişse, tüm kaynaklar izinlidir
    if (allowedSources.length === 0) {
      return;
    }

    if (!allowedSources.includes(source)) {
      throw new BadRequestException(`Başvuru kaynağı "${source}" izinli değil`);
    }
  }

  // TC kimlik numarasına göre iptal edilmiş üye kontrolü
  async checkCancelledMemberByNationalId(nationalId: string, user?: CurrentUserData) {
    if (!nationalId || nationalId.trim().length === 0) {
      return null;
    }

    // Kullanıcının scope'una göre filtreleme yap
    let whereScope: any = {};
    if (user) {
      whereScope = await this.scopeService.buildMemberWhereForUser(user);
      // Impossible filter kontrolü
      if (whereScope.id === '') {
        return null; // Kullanıcının yetkisi yok
      }
    }

    const cancelledMember = await this.prisma.member.findFirst({
      where: {
        nationalId: nationalId.trim(),
        status: {
          in: [MemberStatus.RESIGNED, MemberStatus.EXPELLED, MemberStatus.INACTIVE],
        },
        deletedAt: null,
        isActive: true,
        ...whereScope, // Scope filtresini ekle
      },
      orderBy: {
        cancelledAt: 'desc', // En son iptal edileni al
      },
      include: {
        province: {
          select: { name: true },
        },
        district: {
          select: { name: true },
        },
      },
    });

    return cancelledMember;
  }

  async createApplication(
    dto: CreateMemberApplicationDto,
    createdByUserId?: string,
    previousCancelledMemberId?: string,
    user?: CurrentUserData,
  ) {
    // Başvuru kaynağını kontrol et
    const source = dto.source || MemberSource.DIRECT;
    this.validateAllowedSource(source);

    // Yeniden kayıt kontrolü - eğer iptal edilmiş bir üye varsa ve yeniden kayda izin yoksa reddet
    const allowReRegistration = this.configService.getSystemSettingBoolean('MEMBERSHIP_ALLOW_RE_REGISTRATION', true);
    if (!allowReRegistration && previousCancelledMemberId) {
      throw new BadRequestException('Yeniden kayıt şu anda devre dışı bırakılmıştır');
    }
    
    // Eğer yeniden kayıt kapalıysa ve iptal edilmiş üye varsa kontrol et
    if (!allowReRegistration && user) {
      const cancelledMember = await this.checkCancelledMemberByNationalId(dto.nationalId, user);
      if (cancelledMember) {
        throw new BadRequestException('Bu TC kimlik numarasına sahip iptal edilmiş bir üye bulunmaktadır ve yeniden kayıt şu anda devre dışı bırakılmıştır');
      }
    }

    // Kullanıcının scope'una göre provinceId ve districtId'yi al
    let provinceId: string | undefined = undefined;
    let districtId: string | undefined = undefined;

    if (user) {
      const scopeIds = await this.scopeService.getUserScopeIds(user);
      
      // Eğer kullanıcının scope'u varsa, scope'dakini kullan
      if (scopeIds.provinceId) {
        provinceId = scopeIds.provinceId;
      } else if (dto.provinceId) {
        // Scope'da yoksa DTO'dan al
        provinceId = dto.provinceId;
      }

      if (scopeIds.districtId) {
        districtId = scopeIds.districtId;
      } else if (dto.districtId) {
        // Scope'da yoksa DTO'dan al
        districtId = dto.districtId;
      }

      // Eğer kullanıcının scope'u varsa, DTO'dan gelen provinceId/districtId'yi kontrol et
      if (scopeIds.provinceId && dto.provinceId && dto.provinceId !== scopeIds.provinceId) {
        throw new BadRequestException('Seçilen il, yetkiniz dahilinde değil');
      }
      if (scopeIds.districtId && dto.districtId && dto.districtId !== scopeIds.districtId) {
        throw new BadRequestException('Seçilen ilçe, yetkiniz dahilinde değil');
      }
    } else {
      // Eğer user yoksa DTO'dan al
      provinceId = dto.provinceId;
      districtId = dto.districtId;
    }

    // Zorunlu alan kontrolleri (her zaman zorunlu olanlar)
    if (!dto.branchId) {
      throw new BadRequestException('Bağlı olduğu şube seçilmelidir');
    }
    this.validateNationalIdOrThrow(dto.nationalId);
    if (!dto.institutionId) {
      throw new BadRequestException('Kurum seçimi zorunludur');
    }

    // Sistem ayarlarına göre zorunlu alanları kontrol et
    this.validateRequiredFields(dto, provinceId, districtId);

    // Yönetim kurulu kararı kontrolü
    const requireBoardDecision = this.configService.getSystemSettingBoolean('MEMBERSHIP_REQUIRE_BOARD_DECISION', false);
    if (requireBoardDecision && (!dto.boardDecisionDate || !dto.boardDecisionBookNo)) {
      throw new BadRequestException('Yönetim kurulu karar tarihi ve defter no zorunludur');
    }

    // Kayıt numarası oluşturma - sadece onay sırasında atanacak
    // Başvuru aşamasında null bırakılıyor, onay sırasında admin tarafından atanacak
    const registrationNumber = dto.registrationNumber || null;

    // Varsayılan durum ve otomatik onay kontrolü
    const defaultStatus = this.configService.getSystemSetting('MEMBERSHIP_DEFAULT_STATUS', 'PENDING') as MemberStatus;
    const autoApprove = this.configService.getSystemSettingBoolean('MEMBERSHIP_AUTO_APPROVE', false);
    
    let initialStatus = defaultStatus;
    let approvedByUserId: string | undefined = undefined;
    let approvedAt: Date | undefined = undefined;

    if (autoApprove && defaultStatus === MemberStatus.PENDING) {
      // Otomatik onay aktifse ve varsayılan durum PENDING ise, ACTIVE yap
      initialStatus = MemberStatus.ACTIVE;
      approvedByUserId = createdByUserId;
      approvedAt = new Date();
    } else if (autoApprove) {
      // Otomatik onay aktifse varsayılan durumu kullan ama onay bilgilerini ekle
      approvedByUserId = createdByUserId;
      approvedAt = new Date();
    }

    return this.prisma.member.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        nationalId: dto.nationalId,
        phone: dto.phone,
        email: dto.email,
        source: source,
        status: initialStatus,
        createdByUserId: createdByUserId || null,
        approvedByUserId: approvedByUserId || null,
        approvedAt,
        previousCancelledMemberId: previousCancelledMemberId || null,
        provinceId: provinceId || null,
        districtId: districtId || null,
        // Kurum Detay Bilgileri
        dutyUnit: dto.dutyUnit,
        institutionAddress: dto.institutionAddress,
        institutionProvinceId: dto.institutionProvinceId,
        institutionDistrictId: dto.institutionDistrictId,
        professionId: dto.professionId,
        institutionRegNo: dto.institutionRegNo,
        staffTitleCode: dto.staffTitleCode,
        
        // 🔹 Üyelik & Yönetim Kurulu Bilgileri
        membershipInfoOptionId: dto.membershipInfoOptionId,
        memberGroupId: dto.memberGroupId,
        registrationNumber: registrationNumber,
        boardDecisionDate: dto.boardDecisionDate ? new Date(dto.boardDecisionDate) : null,
        boardDecisionBookNo: dto.boardDecisionBookNo,
        
        // 🔹 Kimlik & Kişisel Bilgiler
        motherName: dto.motherName,
        fatherName: dto.fatherName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        birthplace: dto.birthplace,
        gender: dto.gender,
        
        // 🔹 Eğitim & İletişim Bilgileri
        educationStatus: dto.educationStatus,
        
        // 🔹 Kurum Bilgileri
        institutionId: dto.institutionId,
        tevkifatCenterId: dto.tevkifatCenterId,
        tevkifatTitleId: dto.tevkifatTitleId,
        branchId: dto.branchId, // Zorunlu
      },
    });
  }

  // PENDING başvurular: scope'a göre
  async listApplicationsForUser(user: CurrentUserData) {
    const whereScope = await this.scopeService.buildMemberWhereForUser(user);

    return this.prisma.member.findMany({
      where: {
        ...whereScope,
        status: MemberStatus.PENDING,
        deletedAt: null, // Soft delete kontrolü
        isActive: true,
      },
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Aktif/pasif/istifa/ihrac: scope'a göre
  async listMembersForUser(user: CurrentUserData) {
    const whereScope = await this.scopeService.buildMemberWhereForUser(user);

    console.log('[MembersService] listMembersForUser - userId:', user.userId);
    console.log('[MembersService] whereScope:', JSON.stringify(whereScope, null, 2));

    // Toplam üye sayısını kontrol et (test için)
    const totalMembersCount = await this.prisma.member.count({
      where: {
        status: {
          in: [
            MemberStatus.ACTIVE,
            MemberStatus.INACTIVE,
            MemberStatus.RESIGNED,
            MemberStatus.EXPELLED,
          ],
        },
        deletedAt: null,
        isActive: true,
      },
    });
    console.log('[MembersService] Total members in DB (ACTIVE/INACTIVE/RESIGNED/EXPELLED):', totalMembersCount);

    const members = await this.prisma.member.findMany({
      where: {
        ...whereScope,
        // Tüm durumlardaki üyeleri göster (durumu farketmeksizin, aktif/pasif farketmeksizin)
        deletedAt: null, // Soft delete kontrolü
        // isActive filtresi kaldırıldı - hem aktif hem de pasif üyeler gösterilecek
      },
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
        institution: {
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
      orderBy: { createdAt: 'desc' },
    });

    console.log('[MembersService] Found members after scope filter:', members.length);
    if (members.length === 0 && totalMembersCount > 0) {
      console.log('[MembersService] ⚠️  WARNING: No members found but DB has members. Scope filter might be too restrictive!');
    }
    return members;
  }


  // Reddedilen üyeler: scope'a göre
  async listRejectedMembersForUser(user: CurrentUserData) {
    const whereScope = await this.scopeService.buildMemberWhereForUser(user);

    const members = await this.prisma.member.findMany({
      where: {
        ...whereScope,
        status: MemberStatus.REJECTED,
        deletedAt: null,
        isActive: true,
      },
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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return members;
  }

  async getById(id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id },
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
        institution: {
          select: {
            id: true,
            name: true,
          },
        },
        institutionProvince: {
          select: {
            id: true,
            name: true,
          },
        },
        institutionDistrict: {
          select: {
            id: true,
            name: true,
          },
        },
        profession: {
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
        tevkifatTitle: {
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
        membershipInfoOption: {
          select: {
            id: true,
            label: true,
            value: true,
          },
        },
        memberGroup: {
          select: {
            id: true,
            name: true,
          },
        },
        previousCancelledMember: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            cancelledAt: true,
            cancellationReason: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        cancelledBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            isActive: true,
          },
        },
      },
    });
    if (!member) {
      throw new NotFoundException('Üye bulunamadı');
    }
    return member;
  }

  async updateMember(
    id: string,
    dto: UpdateMemberDto,
    updatedByUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const oldMember = await this.getById(id);

    // Eski veriyi hazırla (history için)
    const oldData: Record<string, any> = {
      firstName: oldMember.firstName,
      lastName: oldMember.lastName,
      phone: oldMember.phone,
      email: oldMember.email,
      membershipInfoOptionId: oldMember.membershipInfoOptionId,
      memberGroupId: oldMember.memberGroupId,
      registrationNumber: oldMember.registrationNumber,
      boardDecisionDate: oldMember.boardDecisionDate,
      boardDecisionBookNo: oldMember.boardDecisionBookNo,
      motherName: oldMember.motherName,
      fatherName: oldMember.fatherName,
      birthplace: oldMember.birthplace,
      gender: oldMember.gender,
      educationStatus: oldMember.educationStatus,
      institutionId: oldMember.institutionId,
      tevkifatCenterId: oldMember.tevkifatCenterId,
      tevkifatTitleId: oldMember.tevkifatTitleId,
      branchId: oldMember.branchId,
      // Kurum Detay Bilgileri
      dutyUnit: oldMember.dutyUnit,
      institutionAddress: oldMember.institutionAddress,
      institutionProvinceId: oldMember.institutionProvinceId,
      institutionDistrictId: oldMember.institutionDistrictId,
      professionId: oldMember.professionId,
      institutionRegNo: oldMember.institutionRegNo,
      staffTitleCode: oldMember.staffTitleCode,
    };

    // Yeni veriyi hazırla
    const updateData: Record<string, any> = {};
    Object.keys(dto).forEach((key) => {
      if (dto[key as keyof UpdateMemberDto] !== undefined) {
        if (key === 'boardDecisionDate' && dto.boardDecisionDate) {
          updateData[key] = new Date(dto.boardDecisionDate);
        } else {
          updateData[key] = dto[key as keyof UpdateMemberDto];
        }
      }
    });

    // RESIGNED veya EXPELLED durumları için cancelledAt ve cancelledByUserId set et
    if (dto.status === MemberStatus.RESIGNED || dto.status === MemberStatus.EXPELLED) {
      updateData.cancelledAt = new Date();
      updateData.cancelledByUserId = updatedByUserId;
      if (dto.cancellationReason) {
        updateData.cancellationReason = dto.cancellationReason;
      }
    } else if (dto.status) {
      // Eğer durum RESIGNED veya EXPELLED değilse, cancellation alanlarını temizle
      updateData.cancelledAt = null;
      updateData.cancelledByUserId = null;
      updateData.cancellationReason = null;
    }

    // Güncelle
    const updatedMember = await this.prisma.member.update({
      where: { id },
      data: updateData,
      include: {
        province: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        institutionProvince: { select: { id: true, name: true } },
        institutionDistrict: { select: { id: true, name: true } },
        profession: { select: { id: true, name: true } },
        institution: { select: { id: true, name: true } },
        tevkifatCenter: { select: { id: true, name: true } },
        tevkifatTitle: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    // History kaydet
    const newData = { ...oldData, ...updateData };
    await this.historyService.logMemberUpdate(
      id,
      updatedByUserId,
      oldData,
      newData,
      ipAddress,
      userAgent,
    );

    return updatedMember;
  }

  async getMemberHistory(id: string) {
    await this.getById(id); // Üyenin var olduğunu kontrol et
    return this.historyService.getMemberHistory(id);
  }

  async approve(
    id: string,
    approvedByUserId?: string,
    dto?: {
      registrationNumber?: string;
      boardDecisionDate?: string;
      boardDecisionBookNo?: string;
    },
  ) {
    const member = await this.getById(id);

    if (member.status !== MemberStatus.PENDING) {
      // istersen burada hata fırlatabilirsin
    }

    const updateData: any = {
      status: MemberStatus.ACTIVE,
      approvedByUserId,
      approvedAt: new Date(),
    };

    if (dto?.registrationNumber) {
      updateData.registrationNumber = dto.registrationNumber;
    }

    if (dto?.boardDecisionDate) {
      updateData.boardDecisionDate = new Date(dto.boardDecisionDate);
    }

    if (dto?.boardDecisionBookNo) {
      updateData.boardDecisionBookNo = dto.boardDecisionBookNo;
    }

    const updatedMember = await this.prisma.member.update({
      where: { id },
      data: updateData,
    });

    // Eğer kayıt numarası atandıysa, evrak dosya isimlerini güncelle
    if (dto?.registrationNumber) {
      try {
        await this.documentsService.updateMemberDocumentFileNames(id, dto.registrationNumber);
      } catch (error) {
        // Evrak güncelleme hatası olsa bile üye onayı devam etsin
        this.logger.warn(`Üye ${id} için evrak dosya isimleri güncellenirken hata: ${error.message}`);
      }
    }

    return updatedMember;
  }

  async reject(id: string, approvedByUserId?: string) {
    await this.getById(id);

    return this.prisma.member.update({
      where: { id },
      data: {
        status: MemberStatus.REJECTED,
        approvedByUserId,
        approvedAt: new Date(),
      },
    });
  }

  async softDelete(id: string, dto?: DeleteMemberDto) {
    // Önce üyeyi kontrol et
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException('Üye bulunamadı');
    }

    // Ödemeleri sil (eğer istenirse)
    if (dto?.deletePayments) {
      await this.prisma.memberPayment.updateMany({
        where: { memberId: id },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    // Dökümanları sil (eğer istenirse)
    if (dto?.deleteDocuments) {
      await this.prisma.memberDocument.updateMany({
        where: { memberId: id },
        data: {
          deletedAt: new Date(),
        },
      });
    }

    // Üyeyi soft delete yap (prisma middleware otomatik olarak soft delete yapar)
    return this.prisma.member.delete({
      where: { id },
    });
  }


  // İptal edilmiş üyeler: scope'a göre
  async listCancelledMembersForUser(user: CurrentUserData) {
    const whereScope = await this.scopeService.buildMemberWhereForUser(user);

    const members = await this.prisma.member.findMany({
      where: {
        ...whereScope,
        status: {
          in: [MemberStatus.RESIGNED, MemberStatus.EXPELLED, MemberStatus.INACTIVE],
        },
        deletedAt: null,
        isActive: true,
      },
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
        cancelledBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { cancelledAt: 'desc' },
    });

    return members;
  }

  async cancelMembership(id: string, dto: CancelMemberDto, cancelledByUserId: string) {
    const member = await this.getById(id);

    // Üyelik iptaline izin kontrolü
    const allowCancellation = this.configService.getSystemSettingBoolean('MEMBERSHIP_ALLOW_CANCELLATION', true);
    if (!allowCancellation) {
      throw new BadRequestException('Üyelik iptali şu anda devre dışı bırakılmıştır');
    }

    // Sadece aktif üyelerin üyeliği iptal edilebilir
    if (member.status !== MemberStatus.ACTIVE) {
      throw new BadRequestException('Sadece aktif üyelerin üyeliği iptal edilebilir');
    }

    return this.prisma.member.update({
      where: { id },
      data: {
        status: dto.status as MemberStatus,
        cancellationReason: dto.cancellationReason,
        cancelledByUserId,
        cancelledAt: new Date(),
      },
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
      },
    });
  }
}
