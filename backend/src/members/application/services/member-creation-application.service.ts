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
 * - Re-registration (aynı TC ile yeniden üyelik) akışı
 */
import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  Member,
  CreateMemberData,
  MemberSourceEnum,
  GenderEnum,
  EducationStatusEnum,
  UpdateMemberData,
} from '../../domain/entities/member.entity';
import type { MemberRepository } from '../../domain/repositories/member.repository.interface';
import type { MemberMembershipPeriodRepository } from '../../domain/repositories/member-membership-period.repository.interface';
import { MemberHistoryService } from '../../member-history.service';
import { MemberRegistrationDomainService } from '../../domain/services/member-registration-domain.service';
import { CreateMemberApplicationDto } from '../dto/create-member-application.dto';
import { MemberScopeService } from '../../member-scope.service';
import { CurrentUserData } from '../../../auth/decorators/current-user.decorator';
import { MemberSource } from '@prisma/client';
import { NationalId } from '../../domain/value-objects/national-id.vo';
import {
  MemberStatus,
  MemberStatusEnum,
} from '../../domain/value-objects/member-status.vo';

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
    @Inject('MemberMembershipPeriodRepository')
    private readonly membershipPeriodRepository: MemberMembershipPeriodRepository,
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
    const allowReRegistration =
      await this.registrationDomainService.configAdapter.getAllowReRegistration();
    if (!allowReRegistration && previousCancelledMemberId) {
      throw new BadRequestException(
        'Yeniden kayıt şu anda devre dışı bırakılmıştır',
      );
    }

    const nationalId = NationalId.create(dto.nationalId);
    if (!allowReRegistration && user) {
      await this.registrationDomainService.validateReRegistration(
        nationalId,
        allowReRegistration,
      );
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
      if (
        scopeIds.provinceId &&
        dto.provinceId &&
        dto.provinceId !== scopeIds.provinceId
      ) {
        throw new BadRequestException('Seçilen il, yetkiniz dahilinde değil');
      }
      if (
        scopeIds.districtId &&
        dto.districtId &&
        dto.districtId !== scopeIds.districtId
      ) {
        throw new BadRequestException('Seçilen ilçe, yetkiniz dahilinde değil');
      }
    } else {
      provinceId = dto.provinceId;
      districtId = dto.districtId;
    }

    // 4. Basic validation (entity için her zaman gerekli alanlar – kurum, doğum tarihi, ikamet il/ilçe)
    if (!dto.institutionId) {
      throw new BadRequestException('Kurum seçimi zorunludur');
    }
    if (!dto.birthDate) {
      throw new BadRequestException('Doğum tarihi zorunludur');
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
      phone: dto.phone ?? '',
      email: dto.email,
      source,
      motherName: dto.motherName ?? '',
      fatherName: dto.fatherName ?? '',
      birthDate: dto.birthDate,
      birthplace: dto.birthplace ?? '',
      gender: (dto.gender as GenderEnum) || GenderEnum.OTHER,
      educationStatus: (dto.educationStatus as EducationStatusEnum) || EducationStatusEnum.PRIMARY,
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

    await this.registrationDomainService.validateMinAge(dto.birthDate);
    await this.registrationDomainService.validateRequiredFields(createData);

    // 6. Registration number generation (Domain Service)
    if (!createData.registrationNumber) {
      createData.registrationNumber =
        (await this.registrationDomainService.generateRegistrationNumber()) ||
        undefined;
    }

    // 6b. Aynı TC ile mevcut üye kontrolü – re-registration veya hata
    const existingMember =
      await this.memberRepository.findByNationalId(nationalId);
    if (existingMember) {
      const existingStatus = existingMember.status.toString();
      const cancelledStatuses = ['RESIGNED', 'EXPELLED', 'INACTIVE'];
      if (cancelledStatuses.includes(existingStatus) && allowReRegistration) {
        // Re-registration: iptal edilmiş üyeyi güncelle (previousCancelledMemberId frontend'den gelmemiş olabilir)
        const targetId = previousCancelledMemberId || existingMember.id;
        createData.previousCancelledMemberId = targetId;
        return this.reRegisterMember(createData, createdByUserId);
      }
      throw new BadRequestException(
        'Bu TC kimlik numarasına ait üye kaydı mevcuttur. Yeniden üyelik için önceki üyeliğin iptal edilmiş olması gerekir.',
      );
    }

    // 7. Re-registration: previousCancelledMemberId ile doğrudan güncelleme
    if (previousCancelledMemberId && allowReRegistration) {
      return this.reRegisterMember(createData, createdByUserId);
    }

    // 8. Initial status determination (Domain Service)
    const defaultStatus =
      await this.registrationDomainService.configAdapter.getDefaultStatus();
    const autoApprove =
      await this.registrationDomainService.configAdapter.getAutoApprove();
    const requireApproval =
      await this.registrationDomainService.configAdapter.getRequireApproval();
    const statusInfo =
      await this.registrationDomainService.determineInitialStatus(
        defaultStatus,
        autoApprove,
        requireApproval,
      );

    // 9. Entity oluştur (Member.create() PENDING oluşturur, status'ü sonra set edeceğiz)
    const member = Member.create(createData);

    // Status ve approval bilgilerini set et (private field'lara erişim için)
    if (statusInfo.status !== 'PENDING') {
      (member as any)._status = MemberStatus.fromString(statusInfo.status);
    }
    if (autoApprove && createdByUserId) {
      (member as any)._approvedByUserId = createdByUserId;
      (member as any)._approvedAt = new Date();
    }

    // 10. Repository'ye kaydet
    const savedMember = await this.memberRepository.create(member);

    // 11. History log
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

  /**
   * Yeniden üyelik: iptal edilmiş üyeyi başvuru (PENDING) olarak güncelle.
   * Üye numarası ve onay alanları başvuruyu onaylayan kişi tarafından doldurulacak; dönem kaydı onay sırasında oluşturulur.
   */
  private async reRegisterMember(
    createData: CreateMemberData,
    createdByUserId?: string,
  ): Promise<Member> {
    const memberId = createData.previousCancelledMemberId!;
    const member = await this.memberRepository.findById(memberId);
    if (!member) {
      throw new NotFoundException(
        `İptal edilmiş üye kaydı bulunamadı: ${memberId}`,
      );
    }

    const updateData: UpdateMemberData = {
      firstName: createData.firstName,
      lastName: createData.lastName,
      phone: createData.phone,
      email: createData.email ?? undefined,
      motherName: createData.motherName,
      fatherName: createData.fatherName,
      birthplace: createData.birthplace,
      gender: createData.gender,
      educationStatus: createData.educationStatus,
      institutionId: createData.institutionId,
      provinceId: createData.provinceId,
      districtId: createData.districtId,
      dutyUnit: createData.dutyUnit ?? undefined,
      institutionAddress: createData.institutionAddress ?? undefined,
      institutionProvinceId: createData.institutionProvinceId ?? undefined,
      institutionDistrictId: createData.institutionDistrictId ?? undefined,
      professionId: createData.professionId ?? undefined,
      institutionRegNo: createData.institutionRegNo ?? undefined,
      staffTitleCode: createData.staffTitleCode ?? undefined,
      membershipInfoOptionId: createData.membershipInfoOptionId ?? undefined,
      memberGroupId: createData.memberGroupId ?? undefined,
      branchId: createData.branchId ?? undefined,
      status: MemberStatusEnum.PENDING,
      approvedAt: null,
      approvedByUserId: null,
    };

    const oldStatus = member.status.toString();
    member.update(updateData);

    await this.memberRepository.save(member);

    await this.memberHistoryService.logMemberUpdate(
      member.id,
      createdByUserId || '',
      { status: oldStatus, note: 'yeniden üyelik başvurusu' },
      {
        firstName: member.firstName,
        lastName: member.lastName,
        nationalId: member.nationalId.getValue(),
        status: member.status.toString(),
      },
    );

    return member;
  }
}
