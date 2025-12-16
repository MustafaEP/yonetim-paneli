import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberApplicationDto } from './dto/create-member-application.dto';
import { CancelMemberDto } from './dto/cancel-member.dto';
import { MemberStatus, MemberSource } from '@prisma/client';
import { MemberScopeService } from './member-scope.service';
import { MemberHistoryService } from './member-history.service';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private scopeService: MemberScopeService,
    private historyService: MemberHistoryService,
  ) {}

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

    // Zorunlu alan kontrolleri
    if (!dto.branchId) {
      throw new BadRequestException('Bağlı olduğu şube seçilmelidir');
    }
    if (!dto.nationalId) {
      throw new BadRequestException('TC Kimlik Numarası zorunludur');
    }
    if (!dto.workingProvinceId) {
      throw new BadRequestException('Çalıştığı il zorunludur');
    }
    if (!dto.workingDistrictId) {
      throw new BadRequestException('Çalıştığı ilçe zorunludur');
    }
    if (!dto.institutionId) {
      throw new BadRequestException('Çalıştığı kurum zorunludur');
    }
    if (!dto.positionTitle) {
      throw new BadRequestException('Kadro ünvanı zorunludur');
    }

    // registrationNumber yoksa geçici bir değer oluştur (admin onaylarken değiştirebilir)
    const registrationNumber = dto.registrationNumber || `TEMP-${Date.now()}`;

    return this.prisma.member.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        nationalId: dto.nationalId,
        phone: dto.phone,
        email: dto.email,
        source: dto.source || MemberSource.DIRECT,
        status: MemberStatus.PENDING,
        createdByUserId,
        previousCancelledMemberId: previousCancelledMemberId || null,
        provinceId: provinceId,
        districtId: districtId,
        
        // 🔹 Üyelik & Yönetim Kurulu Bilgileri
        membershipInfoOptionId: dto.membershipInfoOptionId,
        registrationNumber: registrationNumber, // Zorunlu (geçici değer veya admin tarafından belirlenen)
        boardDecisionDate: dto.boardDecisionDate ? new Date(dto.boardDecisionDate) : null,
        boardDecisionBookNo: dto.boardDecisionBookNo,
        
        // 🔹 Kimlik & Kişisel Bilgiler
        motherName: dto.motherName,
        fatherName: dto.fatherName,
        birthplace: dto.birthplace,
        gender: dto.gender,
        
        // 🔹 Eğitim & İletişim Bilgileri
        educationStatus: dto.educationStatus,
        
        // 🔹 Çalışma & Kurum Bilgileri (zorunlu)
        workingProvinceId: dto.workingProvinceId,
        workingDistrictId: dto.workingDistrictId,
        institutionId: dto.institutionId,
        positionTitle: dto.positionTitle,
        institutionRegNo: dto.institutionRegNo,
        workUnit: dto.workUnit,
        workUnitAddress: dto.workUnitAddress,
        tevkifatCenterId: dto.tevkifatCenterId,
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
        workingProvince: {
          select: {
            id: true,
            name: true,
          },
        },
        workingDistrict: {
          select: {
            id: true,
            name: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
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
        workingProvince: {
          select: {
            id: true,
            name: true,
          },
        },
        workingDistrict: {
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
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        membershipInfoOption: {
          select: {
            id: true,
            label: true,
            value: true,
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
      registrationNumber: oldMember.registrationNumber,
      boardDecisionDate: oldMember.boardDecisionDate,
      boardDecisionBookNo: oldMember.boardDecisionBookNo,
      motherName: oldMember.motherName,
      fatherName: oldMember.fatherName,
      birthplace: oldMember.birthplace,
      gender: oldMember.gender,
      educationStatus: oldMember.educationStatus,
      workingProvinceId: oldMember.workingProvinceId,
      workingDistrictId: oldMember.workingDistrictId,
      institutionId: oldMember.institutionId,
      positionTitle: oldMember.positionTitle,
      institutionRegNo: oldMember.institutionRegNo,
      workUnit: oldMember.workUnit,
      workUnitAddress: oldMember.workUnitAddress,
      tevkifatCenterId: oldMember.tevkifatCenterId,
      branchId: oldMember.branchId,
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

    // Güncelle
    const updatedMember = await this.prisma.member.update({
      where: { id },
      data: updateData,
      include: {
        province: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        workingProvince: { select: { id: true, name: true } },
        workingDistrict: { select: { id: true, name: true } },
        institution: { select: { id: true, name: true } },
        tevkifatCenter: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true, code: true } },
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

  async approve(id: string, approvedByUserId?: string) {
    const member = await this.getById(id);

    if (member.status !== MemberStatus.PENDING) {
      // istersen burada hata fırlatabilirsin
    }

    return this.prisma.member.update({
      where: { id },
      data: {
        status: MemberStatus.ACTIVE,
        approvedByUserId,
        approvedAt: new Date(),
      },
    });
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

  async softDelete(id: string) {
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
