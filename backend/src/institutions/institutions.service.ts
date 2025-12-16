import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { Prisma } from '@prisma/client';

@Injectable()
export class InstitutionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateInstitutionDto, user: CurrentUserData) {
    // İl/İlçe başkanları kurum ekleyebilir, ama admin onayı olmadan aktif olmaz
    // İleride Approval sistemi ile entegre edilecek

    // Kurumun var olup olmadığını kontrol et
    const existing = await this.prisma.institution.findFirst({
      where: {
        name: dto.name,
        provinceId: dto.provinceId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException('Bu kurum zaten kayıtlı');
    }

    const institution = await this.prisma.institution.create({
      data: {
        name: dto.name,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
        branchId: dto.branchId,
        createdBy: user.userId,
        isActive: false, // Admin onayı olmadan aktif olmaz
      },
      include: {
        province: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    // TODO: Approval kaydı oluştur

    return institution;
  }

  async findAll(user: CurrentUserData) {
    // Admin tüm kurumları görebilir
    // İl/İlçe başkanları kendi bölgelerindeki kurumları görebilir
    // TODO: Scope kontrolü ekle

    return this.prisma.institution.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        province: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const institution = await this.prisma.institution.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        province: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    if (!institution) {
      throw new NotFoundException('Kurum bulunamadı');
    }

    return institution;
  }

  async update(id: string, dto: UpdateInstitutionDto, user: CurrentUserData) {
    const institution = await this.findOne(id);

    // TODO: İl/İlçe başkanları için approval gerekli

    return this.prisma.institution.update({
      where: { id },
      data: dto,
      include: {
        province: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async approve(id: string, approvedBy: string) {
    const institution = await this.findOne(id);

    return this.prisma.institution.update({
      where: { id },
      data: {
        isActive: true,
        approvedAt: new Date(),
        approvedBy,
      },
      include: {
        province: { select: { id: true, name: true } },
        district: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });
  }

  async reject(id: string, rejectedBy: string, note?: string) {
    const institution = await this.findOne(id);

    // TODO: Approval kaydını güncelle

    // Kurumu sil (soft delete)
    return this.prisma.institution.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.institution.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
