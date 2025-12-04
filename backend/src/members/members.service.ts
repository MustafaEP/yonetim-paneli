import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberApplicationDto } from './dto/create-member-application.dto';
import { MemberStatus, MemberSource } from '@prisma/client';
import { MemberScopeService } from './member-scope.service';
import { CurrentUserData } from '../auth/current-user.decorator';

@Injectable()
export class MembersService {
  constructor(
    private prisma: PrismaService,
    private scopeService: MemberScopeService,
  ) {}

  async createApplication(
    dto: CreateMemberApplicationDto,
    createdByUserId?: string,
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
        // burada istersen dto üzerinden provinceId / districtId / workplaceId / dealerId de set edebilirsin
      },
    });
  }

  // PENDING başvurular: scope’a göre
  async listApplicationsForUser(user: CurrentUserData) {
    const whereScope = await this.scopeService.buildMemberWhereForUser(user);

    return this.prisma.member.findMany({
      where: {
        ...whereScope,
        status: MemberStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Aktif/pasif/istifa/ihrac: scope’a göre
  async listMembersForUser(user: CurrentUserData) {
    const whereScope = await this.scopeService.buildMemberWhereForUser(user);

    return this.prisma.member.findMany({
      where: {
        ...whereScope,
        status: {
          in: [
            MemberStatus.ACTIVE,
            MemberStatus.PASIF,
            MemberStatus.ISTIFA,
            MemberStatus.IHRAC,
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id },
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
}
