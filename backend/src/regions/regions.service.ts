import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProvinceDto,
  CreateDistrictDto,
  AssignUserScopeDto,
  CreateBranchDto,
  UpdateBranchDto,
  AssignBranchPresidentDto,
  CreateInstitutionDto,
  UpdateInstitutionDto,
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

  async getProvinceById(id: string) {
    const province = await this.prisma.province.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            districts: true,
            institutions: true,
            members: true,
          },
        },
      },
    });

    if (!province) {
      throw new NotFoundException('İl bulunamadı');
    }

    return {
      ...province,
      districtCount: province._count.districts,
      institutionCount: province._count.institutions,
      memberCount: province._count.members,
      _count: undefined,
    };
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

  async getDistrictById(id: string) {
    const district = await this.prisma.district.findUnique({
      where: { id },
      include: {
        province: true,
        _count: {
          select: {
            institutions: true,
            members: true,
          },
        },
      },
    });

    if (!district) {
      throw new NotFoundException('İlçe bulunamadı');
    }

    return {
      ...district,
      institutionCount: district._count.institutions,
      memberCount: district._count.members,
      _count: undefined,
    };
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
      },
    });

    if (!scope) {
      throw new NotFoundException('Kullanıcı için scope kaydı bulunamadı');
    }

    return scope;
  }

  // ---------- BRANCH ----------
  async listBranches(filters?: { isActive?: boolean; provinceId?: string; districtId?: string }) {
    const where: Prisma.BranchWhereInput = {};
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;
    if (filters?.provinceId) where.provinceId = filters.provinceId;
    if (filters?.districtId) where.districtId = filters.districtId;

    const branches = await this.prisma.branch.findMany({
      where,
      include: {
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
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // _count'ları dönüştür ve branchSharePercent ekle
    return branches.map((branch) => ({
      ...branch,
      memberCount: branch._count.members,
      branchSharePercent: branch.branchSharePercent ? Number(branch.branchSharePercent) : 40,
      _count: undefined,
    }));
  }

  async getBranchById(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: {
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
      totalRevenue: totalRevenueAmount,
      branchShareAmount,
      branchSharePercent,
      _count: undefined,
    };
  }

  async createBranch(dto: CreateBranchDto) {
    return this.prisma.branch.create({
      data: {
        name: dto.name,
        code: dto.code,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        ...(dto.provinceId && { provinceId: dto.provinceId }),
        ...(dto.districtId && { districtId: dto.districtId }),
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
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        isActive: dto.isActive,
        ...(dto.provinceId !== undefined && { provinceId: dto.provinceId }),
        ...(dto.districtId !== undefined && { districtId: dto.districtId }),
      },
      include: {
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

  // ---------- INSTITUTION ----------
  async listInstitutions(provinceId?: string, districtId?: string, isActive?: boolean) {
    const where: Prisma.InstitutionWhereInput = {
      deletedAt: null,
    };

    // Eğer districtId verilmişse, sadece o ilçeye bağlı olanları göster
    if (districtId) {
      where.districtId = districtId;
    } else if (provinceId) {
      // Eğer sadece provinceId verilmişse, o ile direkt bağlı olanları VEYA o ilin ilçelerine bağlı olanları göster
      where.OR = [
        { provinceId: provinceId },
        { district: { provinceId: provinceId } },
      ];
    }

    if (isActive !== undefined) where.isActive = isActive;

    const institutions = await this.prisma.institution.findMany({
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
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    // _count'ları memberCount'a dönüştür
    return institutions.map((institution) => ({
      ...institution,
      memberCount: institution._count.members,
      _count: undefined,
    }));
  }

  async getInstitutionById(id: string) {
    const institution = await this.prisma.institution.findFirst({
      where: {
        id,
        deletedAt: null,
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
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!institution) {
      throw new NotFoundException('Kurum bulunamadı');
    }

    return {
      ...institution,
      memberCount: institution._count.members,
      _count: undefined,
    };
  }

  async createInstitution(dto: CreateInstitutionDto, createdBy?: string) {
    return this.prisma.institution.create({
      data: {
        name: dto.name,
        ...(dto.provinceId ? { provinceId: dto.provinceId } : {}),
        ...(dto.districtId ? { districtId: dto.districtId } : {}),
        ...(dto.kurumSicilNo ? { kurumSicilNo: dto.kurumSicilNo } : {}),
        ...(dto.gorevBirimi ? { gorevBirimi: dto.gorevBirimi } : {}),
        ...(dto.kurumAdresi ? { kurumAdresi: dto.kurumAdresi } : {}),
        ...(dto.kadroUnvanKodu ? { kadroUnvanKodu: dto.kadroUnvanKodu } : {}),
        ...(createdBy ? { createdBy } : {}),
        isActive: false, // Admin onayı gerekli
      } as Prisma.InstitutionCreateInput,
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

  async updateInstitution(id: string, dto: UpdateInstitutionDto) {
    const existing = await this.prisma.institution.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Kurum bulunamadı');
    }

    return this.prisma.institution.update({
      where: { id },
      data: {
        name: dto.name,
        provinceId: dto.provinceId !== undefined ? dto.provinceId : undefined,
        districtId: dto.districtId !== undefined ? dto.districtId : undefined,
        kurumSicilNo: dto.kurumSicilNo,
        gorevBirimi: dto.gorevBirimi,
        kurumAdresi: dto.kurumAdresi,
        kadroUnvanKodu: dto.kadroUnvanKodu,
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
      },
    });
  }

  async approveInstitution(id: string, approvedBy: string) {
    const existing = await this.prisma.institution.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Kurum bulunamadı');
    }

    return this.prisma.institution.update({
      where: { id },
      data: {
        isActive: true,
        approvedAt: new Date(),
        approvedBy,
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

  async deleteInstitution(id: string) {
    const existing = await this.prisma.institution.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!existing) {
      throw new NotFoundException('Kurum bulunamadı');
    }

    // Soft delete
    return this.prisma.institution.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
