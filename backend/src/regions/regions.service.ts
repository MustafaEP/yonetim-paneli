import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProvinceDto,
  CreateDistrictDto,
  CreateWorkplaceDto,
  CreateDealerDto,
  AssignUserScopeDto,
  CreateBranchDto,
  UpdateBranchDto,
  AssignBranchPresidentDto,
} from './dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RegionsService {
  constructor(private prisma: PrismaService) {}

  // ---------- PROVINCE ----------
  async listProvinces() {
    return this.prisma.province.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createProvince(dto: CreateProvinceDto) {
    return this.prisma.province.create({
      data: {
        name: dto.name,
        code: dto.code,
      },
    });
  }

  async updateProvince(id: string, dto: CreateProvinceDto) {
    return this.prisma.province.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
      },
    });
  }

  // ---------- DISTRICT ----------
  async listDistricts(provinceId?: string) {
    const where: Prisma.DistrictWhereInput = {};
    if (provinceId) where.provinceId = provinceId;

    return this.prisma.district.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async createDistrict(dto: CreateDistrictDto) {
    return this.prisma.district.create({
      data: {
        name: dto.name,
        provinceId: dto.provinceId,
      },
    });
  }

  async updateDistrict(id: string, dto: CreateDistrictDto) {
    return this.prisma.district.update({
      where: { id },
      data: {
        name: dto.name,
        provinceId: dto.provinceId,
      },
    });
  }

  // ---------- WORKPLACE ----------
  async listWorkplaces(provinceId?: string, districtId?: string) {
    const where: Prisma.WorkplaceWhereInput = {};
    if (provinceId) where.provinceId = provinceId;
    if (districtId) where.districtId = districtId;

    return this.prisma.workplace.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async createWorkplace(dto: CreateWorkplaceDto) {
    return this.prisma.workplace.create({
      data: {
        name: dto.name,
        address: dto.address,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
      },
    });
  }

  async updateWorkplace(id: string, dto: CreateWorkplaceDto) {
    return this.prisma.workplace.update({
      where: { id },
      data: {
        name: dto.name,
        address: dto.address,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
      },
    });
  }

  // ---------- DEALER ----------
  async listDealers(provinceId?: string, districtId?: string) {
    const where: Prisma.DealerWhereInput = {};
    if (provinceId) where.provinceId = provinceId;
    if (districtId) where.districtId = districtId;

    return this.prisma.dealer.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async createDealer(dto: CreateDealerDto) {
    return this.prisma.dealer.create({
      data: {
        name: dto.name,
        code: dto.code,
        address: dto.address,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
      },
    });
  }

  async updateDealer(id: string, dto: CreateDealerDto) {
    return this.prisma.dealer.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        address: dto.address,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
      },
    });
  }

  // ---------- USER SCOPE ----------
  async assignUserScope(dto: AssignUserScopeDto) {
    // En az bir scope alanı dolu mu kontrol edebilirsin, şimdilik opsiyonel bırakıyorum

    const existing = await this.prisma.userScope.findFirst({
      where: { userId: dto.userId },
    });

    const data = {
      provinceId: dto.provinceId || null,
      districtId: dto.districtId || null,
      workplaceId: dto.workplaceId || null,
      dealerId: dto.dealerId || null,
    };

    if (existing) {
      return this.prisma.userScope.update({
        where: { id: existing.id },
        data,
      });
    }

    return this.prisma.userScope.create({
      data: {
        userId: dto.userId,
        ...data,
      },
    });
  }

  async getUserScope(userId: string) {
    const scope = await this.prisma.userScope.findFirst({
      where: { userId },
      include: {
        province: true,
        district: true,
        workplace: true,
        dealer: true,
      },
    });

    if (!scope) {
      throw new NotFoundException('Kullanıcı için scope kaydı bulunamadı');
    }

    return scope;
  }

  // ---------- BRANCH ----------
  async listBranches(filters?: { provinceId?: string; districtId?: string; isActive?: boolean }) {
    const where: Prisma.BranchWhereInput = {};
    if (filters?.provinceId) where.provinceId = filters.provinceId;
    if (filters?.districtId) where.districtId = filters.districtId;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const branches = await this.prisma.branch.findMany({
      where,
      include: {
        province: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
        president: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            institutions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // _count'ları dönüştür ve branchSharePercent ekle
    return branches.map((branch) => ({
      ...branch,
      memberCount: branch._count.members,
      institutionCount: branch._count.institutions,
      branchSharePercent: branch.branchSharePercent ? Number(branch.branchSharePercent) : 40,
      _count: undefined,
    }));
  }

  async getBranchById(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
        province: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
        president: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            members: true,
            institutions: true,
          },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException('Şube bulunamadı');
    }

    // Aktif üye sayısı
    const activeMemberCount = await this.prisma.member.count({
      where: {
        branchId: id,
        status: 'ACTIVE',
        deletedAt: null,
        isActive: true,
      },
    });

    // Şubeye bağlı kurumlar
    const institutions = await this.prisma.institution.findMany({
      where: {
        branchId: id,
      },
      select: {
        id: true,
        name: true,
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
        isActive: true,
        approvedAt: true,
      },
      orderBy: { name: 'asc' },
    });

    // Tevkifat merkezlerinden gelen toplam gelir (onaylı ödemeler)
    const totalRevenue = await this.prisma.memberPayment.aggregate({
      where: {
        member: {
          branchId: id,
        },
        isApproved: true,
        paymentType: 'TEVKIFAT',
      },
      _sum: {
        amount: true,
      },
    });

    const totalRevenueAmount = totalRevenue._sum.amount || 0;
    const branchSharePercent = branch.branchSharePercent ? Number(branch.branchSharePercent) : 40;
    const branchShareAmount = Number(totalRevenueAmount) * (branchSharePercent / 100);

    // _count.members'i memberCount'a dönüştür
    return {
      ...branch,
      memberCount: branch._count.members,
      activeMemberCount,
      institutionCount: branch._count.institutions,
      totalRevenue: totalRevenueAmount,
      branchShareAmount,
      branchSharePercent,
      institutions,
      _count: undefined,
    };
  }

  async createBranch(dto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: {
        name: dto.name,
        code: dto.code,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
      },
      include: {
        province: {
          select: {
            id: true,
            name: true,
            code: true,
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

  async updateBranch(id: string, dto: UpdateBranchDto) {
    const existing = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Şube bulunamadı');
    }

    return this.prisma.branch.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        isActive: dto.isActive,
      },
      include: {
        province: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
        president: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteBranch(id: string) {
    const existing = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Şube bulunamadı');
    }

    await this.prisma.branch.delete({
      where: { id },
    });
  }

  async assignBranchPresident(id: string, dto: AssignBranchPresidentDto) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
    });

    if (!branch) {
      throw new NotFoundException('Şube bulunamadı');
    }

    // Kullanıcının var olduğunu kontrol et
    const user = await this.prisma.user.findUnique({
      where: { id: dto.presidentId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }

    return this.prisma.branch.update({
      where: { id },
      data: {
        presidentId: dto.presidentId,
      },
      include: {
        province: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        district: {
          select: {
            id: true,
            name: true,
          },
        },
        president: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }
}
