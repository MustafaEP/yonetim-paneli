import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProvinceDto,
  CreateDistrictDto,
  CreateWorkplaceDto,
  CreateDealerDto,
  AssignUserScopeDto,
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
}
