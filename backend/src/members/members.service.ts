import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberApplicationDto } from './application/dto/create-member-application.dto';
import { CancelMemberDto } from './application/dto/cancel-member.dto';
import { ApproveMemberDto } from './application/dto/approve-member.dto';
import { MemberStatus, MemberSource, Prisma } from '@prisma/client';
import { MemberScopeService } from './member-scope.service';
import { MemberHistoryService } from './member-history.service';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { UpdateMemberDto } from './application/dto/update-member.dto';
import { DeleteMemberDto } from './application/dto/delete-member.dto';
import { ConfigService } from '../config/config.service';
import { DocumentsService } from '../documents/documents.service';
import { forwardRef, Inject } from '@nestjs/common';
// 🆕 Yeni mimari: Domain-driven yapı
import { MemberApprovalApplicationService } from './application/services/member-approval-application.service';
import { MemberActivationApplicationService } from './application/services/member-activation-application.service';
import { MemberRejectionApplicationService } from './application/services/member-rejection-application.service';
import { MemberCancellationApplicationService } from './application/services/member-cancellation-application.service';
import { MemberUpdateApplicationService } from './application/services/member-update-application.service';
import { MemberCreationApplicationService } from './application/services/member-creation-application.service';

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
    // 🆕 Yeni mimari: Application Service inject et
    private memberApprovalApplicationService: MemberApprovalApplicationService,
    private memberActivationApplicationService: MemberActivationApplicationService,
    private memberRejectionApplicationService: MemberRejectionApplicationService,
    private memberCancellationApplicationService: MemberCancellationApplicationService,
    private memberUpdateApplicationService: MemberUpdateApplicationService,
    private memberCreationApplicationService: MemberCreationApplicationService,
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

  /**
   * Create Member Application
   * 
   * ✅ Yeni mimari: MemberCreationApplicationService kullanıyor
   */
  async createApplication(
    dto: CreateMemberApplicationDto,
    createdByUserId?: string,
    previousCancelledMemberId?: string,
    user?: CurrentUserData,
  ) {
    const member = await this.memberCreationApplicationService.createApplication({
      dto,
      createdByUserId,
      previousCancelledMemberId,
      user,
    });

    // Domain Entity → Prisma model'e dönüştür
    return await this.getById(member.id);
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

  // Ana üye listesi: Status parametresine göre filtreleme yapar
  // Varsayılan olarak ACTIVE üyeler gösterilir
  async listMembersForUser(user: CurrentUserData, status?: MemberStatus) {
    const whereScope = await this.scopeService.buildMemberWhereForUser(user);

    console.log('[MembersService] listMembersForUser - userId:', user.userId);
    console.log('[MembersService] whereScope:', JSON.stringify(whereScope, null, 2));
    console.log('[MembersService] status filter:', status || 'ACTIVE (default)');

    // Status belirtilmemişse varsayılan olarak ACTIVE
    const filterStatus = status || MemberStatus.ACTIVE;

    const members = await this.prisma.member.findMany({
      where: {
        ...whereScope,
        status: filterStatus,
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
      orderBy: { createdAt: 'desc' },
    });

    console.log('[MembersService] Found members after scope filter:', members.length);
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
        membershipPeriods: {
          orderBy: { periodStart: 'desc' },
          include: {
            approvedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
            cancelledBy: {
              select: { id: true, firstName: true, lastName: true },
            },
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

  /**
   * Update Member
   * 
   * ✅ Yeni mimari: MemberUpdateApplicationService kullanıyor
   */
  async updateMember(
    id: string,
    dto: UpdateMemberDto,
    updatedByUserId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // 🆕 Yeni mimari: Application Service kullan
    const member = await this.memberUpdateApplicationService.updateMember({
      memberId: id,
      updatedByUserId,
      updateData: dto,
      ipAddress,
      userAgent,
    });

    // Domain Entity → Prisma model'e dönüştür
    return await this.getById(member.id);
  }

  async getMemberHistory(id: string) {
    await this.getById(id); // Üyenin var olduğunu kontrol et
    return this.historyService.getMemberHistory(id);
  }

  /**
   * Approve Member
   * 
   * ✅ Yeni mimari: MemberApprovalApplicationService kullanıyor
   */
  async approve(
    id: string,
    approvedByUserId?: string,
    dto?: ApproveMemberDto,
  ) {
    // 🆕 Yeni mimari: Application Service kullan
    if (!approvedByUserId) {
      throw new BadRequestException('Onaylayan kullanıcı ID zorunludur');
    }

    const member = await this.memberApprovalApplicationService.approveMember({
      memberId: id,
      approvedByUserId,
      registrationNumber: dto?.registrationNumber,
      boardDecisionDate: dto?.boardDecisionDate,
      boardDecisionBookNo: dto?.boardDecisionBookNo,
      tevkifatCenterId: dto?.tevkifatCenterId,
      tevkifatTitleId: dto?.tevkifatTitleId,
      branchId: dto?.branchId,
      memberGroupId: dto?.memberGroupId,
    });

    // Domain Entity → Prisma model'e dönüştür
    return await this.getById(member.id);
  }

  /**
   * Reject Member
   * 
   * ✅ Yeni mimari: MemberRejectionApplicationService kullanıyor
   */
  async reject(id: string, approvedByUserId?: string) {
    // 🆕 Yeni mimari: Application Service kullan
    if (!approvedByUserId) {
      throw new BadRequestException('Reddeden kullanıcı ID zorunludur');
    }

    const member = await this.memberRejectionApplicationService.rejectMember({
      memberId: id,
      rejectedByUserId: approvedByUserId,
    });

    // Domain Entity → Prisma model'e dönüştür
    return await this.getById(member.id);
  }

  /**
   * Activate Member
   * 
   * ✅ Yeni mimari: MemberActivationApplicationService kullanıyor
   */
  async activate(id: string, activatedByUserId?: string) {
    // 🆕 Yeni mimari: Application Service kullan
    if (!activatedByUserId) {
      throw new BadRequestException('Aktifleştiren kullanıcı ID zorunludur');
    }

    const member = await this.memberActivationApplicationService.activateMember({
      memberId: id,
      activatedByUserId,
    });

    // Domain Entity → Prisma model'e dönüştür
    return await this.getById(member.id);
  }

  // APPROVED başvurular: scope'a göre
  async listApprovedMembersForUser(user: CurrentUserData) {
    const whereScope = await this.scopeService.buildMemberWhereForUser(user);

    return this.prisma.member.findMany({
      where: {
        ...whereScope,
        status: MemberStatus.APPROVED,
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
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
          },
        },
        memberGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { approvedAt: 'desc' },
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

  /**
   * Cancel Membership
   * 
   * ✅ Yeni mimari: MemberCancellationApplicationService kullanıyor
   */
  async cancelMembership(id: string, dto: CancelMemberDto, cancelledByUserId: string) {
    // Üyelik iptaline izin kontrolü (config check - bu Application Service'te olabilir ama şimdilik burada)
    const allowCancellation = this.configService.getSystemSettingBoolean('MEMBERSHIP_ALLOW_CANCELLATION', true);
    if (!allowCancellation) {
      throw new BadRequestException('Üyelik iptali şu anda devre dışı bırakılmıştır');
    }

    // 🆕 Yeni mimari: Application Service kullan
    const member = await this.memberCancellationApplicationService.cancelMembership({
      memberId: id,
      cancelledByUserId,
      status: dto.status as any,
      cancellationReason: dto.cancellationReason,
    });

    // Domain Entity → Prisma model'e dönüştür
    return await this.getById(member.id);
  }
}
