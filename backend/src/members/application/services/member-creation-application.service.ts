/**
 * Member Creation Application Service
 * 
 * Use case: Member creation işlemini orchestrate eder
 * 
 * Sorumluluklar:
 * - Transaction yönetimi
 * - Domain Service çağırma
 * - Cross-cutting concerns (history)
 * - Repository koordinasyonu
 */
import { Injectable, BadRequestException, Logger, Inject } from '@nestjs/common';
import { Member, CreateMemberData, MemberSourceEnum, GenderEnum, EducationStatusEnum } from '../../domain/entities/member.entity';
import type { MemberRepository } from '../../domain/repositories/member.repository.interface';
import { MemberHistoryService } from '../../member-history.service';
import { MemberRegistrationDomainService } from '../../domain/services/member-registration-domain.service';
import { CreateMemberApplicationDto } from '../dto/create-member-application.dto';
import { MemberScopeService } from '../../member-scope.service';
import { CurrentUserData } from '../../../auth/decorators/current-user.decorator';
import { MemberSource } from '@prisma/client';
import { NationalId } from '../../domain/value-objects/national-id.vo';
import { MemberStatus } from '../../domain/value-objects/member-status.vo';

export interface CreateMemberCommand {
  dto: CreateMemberApplicationDto;
  createdByUserId?: string;
  previousCancelledMemberId?: string;
  user?: CurrentUserData;
}

@Injectable()
export class MemberCreationApplicationService {
  private readonly logger = new Logger(MemberCreationApplicationService.name);

  constructor(
    @Inject('MemberRepository')
    private readonly memberRepository: MemberRepository,
    private readonly memberHistoryService: MemberHistoryService,
    private readonly registrationDomainService: MemberRegistrationDomainService,
    private readonly scopeService: MemberScopeService,
  ) {}

  /**
   * Use case: Member başvurusu oluştur
   * 
   * Orchestration:
   * 1. Source validation (Domain Service)
   * 2. Re-registration validation (Domain Service)
   * 3. Scope resolution
   * 4. Required fields validation (Domain Service)
   * 5. Registration number generation (Domain Service)
   * 6. Initial status determination (Domain Service)
   * 7. Entity oluştur
   * 8. Repository'ye kaydet
   * 9. History log
   */
  async createApplication(command: CreateMemberCommand): Promise<Member> {
    const { dto, createdByUserId, previousCancelledMemberId, user } = command;

    // 1. Source validation
    const source = (dto.source || MemberSource.DIRECT) as MemberSourceEnum;
    await this.registrationDomainService.validateSource(source);

    // 2. Re-registration validation
    const allowReRegistration = await this.registrationDomainService.configAdapter.getAllowReRegistration();
    if (!allowReRegistration && previousCancelledMemberId) {
      throw new BadRequestException('Yeniden kayıt şu anda devre dışı bırakılmıştır');
    }

    const nationalId = NationalId.create(dto.nationalId);
    if (!allowReRegistration && user) {
      await this.registrationDomainService.validateReRegistration(nationalId, allowReRegistration);
    }

    // 3. Scope resolution
    let provinceId: string | undefined = undefined;
    let districtId: string | undefined = undefined;

    if (user) {
      const scopeIds = await this.scopeService.getUserScopeIds(user);
      
      if (scopeIds.provinceId) {
        provinceId = scopeIds.provinceId;
      } else if (dto.provinceId) {
        provinceId = dto.provinceId;
      }

      if (scopeIds.districtId) {
        districtId = scopeIds.districtId;
      } else if (dto.districtId) {
        districtId = dto.districtId;
      }

      // Scope validation
      if (scopeIds.provinceId && dto.provinceId && dto.provinceId !== scopeIds.provinceId) {
        throw new BadRequestException('Seçilen il, yetkiniz dahilinde değil');
      }
      if (scopeIds.districtId && dto.districtId && dto.districtId !== scopeIds.districtId) {
        throw new BadRequestException('Seçilen ilçe, yetkiniz dahilinde değil');
      }
    } else {
      provinceId = dto.provinceId;
      districtId = dto.districtId;
    }

    // 4. Basic validation (her zaman zorunlu alanlar)
    if (!dto.institutionId) {
      throw new BadRequestException('Kurum seçimi zorunludur');
    }
    if (!dto.motherName || dto.motherName.trim() === '') {
      throw new BadRequestException('Anne adı zorunludur');
    }
    if (!dto.fatherName || dto.fatherName.trim() === '') {
      throw new BadRequestException('Baba adı zorunludur');
    }
    if (!dto.birthDate) {
      throw new BadRequestException('Doğum tarihi zorunludur');
    }
    if (!dto.birthplace || dto.birthplace.trim() === '') {
      throw new BadRequestException('Doğum yeri zorunludur');
    }
    if (!dto.gender) {
      throw new BadRequestException('Cinsiyet seçimi zorunludur');
    }
    if (!dto.educationStatus) {
      throw new BadRequestException('Öğrenim durumu zorunludur');
    }
    if (!dto.phone || dto.phone.trim() === '') {
      throw new BadRequestException('Telefon numarası zorunludur');
    }

    const finalProvinceId = provinceId || dto.provinceId;
    const finalDistrictId = districtId || dto.districtId;
    if (!finalProvinceId) {
      throw new BadRequestException('İl seçimi zorunludur');
    }
    if (!finalDistrictId) {
      throw new BadRequestException('İlçe seçimi zorunludur');
    }

    // 5. Config-based validation (Domain Service)
    const createData: CreateMemberData = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      nationalId: dto.nationalId,
      phone: dto.phone,
      email: dto.email,
      source,
      motherName: dto.motherName,
      fatherName: dto.fatherName,
      birthDate: dto.birthDate,
      birthplace: dto.birthplace,
      gender: dto.gender as GenderEnum,
      educationStatus: dto.educationStatus as EducationStatusEnum,
      institutionId: dto.institutionId,
      provinceId: finalProvinceId,
      districtId: finalDistrictId,
      dutyUnit: dto.dutyUnit,
      institutionAddress: dto.institutionAddress,
      institutionProvinceId: dto.institutionProvinceId,
      institutionDistrictId: dto.institutionDistrictId,
      professionId: dto.professionId,
      institutionRegNo: dto.institutionRegNo,
      staffTitleCode: dto.staffTitleCode,
      membershipInfoOptionId: dto.membershipInfoOptionId,
      memberGroupId: dto.memberGroupId,
      registrationNumber: dto.registrationNumber,
      boardDecisionDate: dto.boardDecisionDate,
      boardDecisionBookNo: dto.boardDecisionBookNo,
      tevkifatCenterId: dto.tevkifatCenterId,
      tevkifatTitleId: dto.tevkifatTitleId,
      branchId: dto.branchId,
      createdByUserId,
      previousCancelledMemberId,
    };

    await this.registrationDomainService.validateRequiredFields(createData);

    // 6. Registration number generation (Domain Service)
    if (!createData.registrationNumber) {
      createData.registrationNumber = await this.registrationDomainService.generateRegistrationNumber() || undefined;
    }

    // 7. Initial status determination (Domain Service)
    const defaultStatus = await this.registrationDomainService.configAdapter.getDefaultStatus();
    const autoApprove = await this.registrationDomainService.configAdapter.getAutoApprove();
    const statusInfo = await this.registrationDomainService.determineInitialStatus(defaultStatus, autoApprove);

    // 8. Entity oluştur (Member.create() PENDING oluşturur, status'ü sonra set edeceğiz)
    const member = Member.create(createData);

    // Status ve approval bilgilerini set et (private field'lara erişim için)
    if (statusInfo.status !== 'PENDING') {
      (member as any)._status = MemberStatus.fromString(statusInfo.status);
    }
    if (autoApprove && createdByUserId) {
      (member as any)._approvedByUserId = createdByUserId;
      (member as any)._approvedAt = new Date();
    }

    // 9. Repository'ye kaydet
    const savedMember = await this.memberRepository.create(member);

    // 10. History log
    const memberData: Record<string, any> = {
      firstName: savedMember.firstName,
      lastName: savedMember.lastName,
      nationalId: savedMember.nationalId.getValue(),
      status: savedMember.status.toString(),
      createdByUserId: savedMember.createdByUserId,
      approvedByUserId: savedMember.approvedByUserId,
      approvedAt: savedMember.approvedAt,
    };
    await this.memberHistoryService.logMemberCreate(
      savedMember.id,
      createdByUserId || '',
      memberData,
    );

    return savedMember;
  }
}
