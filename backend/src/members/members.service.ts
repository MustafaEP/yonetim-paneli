import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberApplicationDto } from './dto/create-member-application.dto';
import { UpdateMemberDuesPlanDto } from './dto/update-member-dues-plan.dto';
import { CancelMemberDto } from './dto/cancel-member.dto';
import { MemberStatus, MemberSource } from '@prisma/client';
import { MemberScopeService } from './member-scope.service';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private scopeService: MemberScopeService,
  ) {}

  // TC kimlik numarasına göre iptal edilmiş üye kontrolü
  async checkCancelledMemberByNationalId(nationalId: string) {
    if (!nationalId || nationalId.trim().length === 0) {
      return null;
    }

    const cancelledMember = await this.prisma.member.findFirst({
      where: {
        nationalId: nationalId.trim(),
        status: {
          in: [MemberStatus.RESIGNED, MemberStatus.EXPELLED, MemberStatus.INACTIVE],
        },
        deletedAt: null,
        isActive: true,
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
        duesPlan: {
          select: { name: true, amount: true },
        },
      },
    });

    return cancelledMember;
  }

  async createApplication(
    dto: CreateMemberApplicationDto,
    createdByUserId?: string,
    previousCancelledMemberId?: string,
  ) {
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
        duesPlanId: dto.duesPlanId,
        previousCancelledMemberId: previousCancelledMemberId || null,
        // burada istersen dto üzerinden provinceId / districtId / workplaceId / dealerId de set edebilirsin
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
        status: MemberStatus.ACTIVE, // Sadece aktif üyeler (iptal edilmişler hariç)
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
        duesPlan: {
          select: {
            id: true,
            name: true,
            amount: true,
            period: true,
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
        duesPlan: {
          select: {
            id: true,
            name: true,
            amount: true,
            period: true,
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
        workplace: {
          select: {
            id: true,
            name: true,
          },
        },
        dealer: {
          select: {
            id: true,
            name: true,
          },
        },
        duesPlan: {
          select: {
            id: true,
            name: true,
            amount: true,
            period: true,
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

  async updateDuesPlan(id: string, dto: UpdateMemberDuesPlanDto) {
    const member = await this.getById(id); // Üyenin var olduğunu kontrol et

    // Reddedilmiş üyelerin aidat planı değiştirilemez
    if (member.status === MemberStatus.REJECTED) {
      throw new BadRequestException('Reddedilmiş üyelerin aidat planı değiştirilemez');
    }

    // Aidat planının var olduğunu kontrol et
    const plan = await this.prisma.duesPlan.findUnique({
      where: { id: dto.duesPlanId },
    });
    if (!plan) {
      throw new NotFoundException('Aidat planı bulunamadı');
    }

    return this.prisma.member.update({
      where: { id },
      data: {
        duesPlanId: dto.duesPlanId,
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
        workplace: {
          select: {
            id: true,
            name: true,
          },
        },
        dealer: {
          select: {
            id: true,
            name: true,
          },
        },
        duesPlan: {
          select: {
            id: true,
            name: true,
            amount: true,
            period: true,
          },
        },
      },
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
        duesPlan: {
          select: {
            id: true,
            name: true,
            amount: true,
            period: true,
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
        duesPlan: {
          select: {
            id: true,
            name: true,
            amount: true,
            period: true,
          },
        },
      },
    });
  }
}
