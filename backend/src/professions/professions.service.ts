import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { UpdateProfessionDto } from './dto/update-profession.dto';

@Injectable()
export class ProfessionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Meslek/Unvan listesini getir
   */
  async listProfessions() {
    return this.prisma.profession.findMany({
      where: {
        isActive: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Tüm meslek/unvanları getir (aktif ve pasif)
   */
  async listAllProfessions() {
    return this.prisma.profession.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Meslek/Unvan detayını getir
   */
  async getProfessionById(id: string) {
    const profession = await this.prisma.profession.findUnique({
      where: { id },
    });

    if (!profession) {
      throw new NotFoundException('Meslek/Unvan bulunamadı');
    }

    return profession;
  }

  /**
   * Meslek/Unvan oluştur
   */
  async createProfession(dto: CreateProfessionDto) {
    // İsim benzersizlik kontrolü
    const existing = await this.prisma.profession.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Bu meslek/unvan zaten mevcut');
    }

    return this.prisma.profession.create({
      data: {
        name: dto.name,
      },
    });
  }

  /**
   * Meslek/Unvan güncelle
   */
  async updateProfession(id: string, dto: UpdateProfessionDto) {
    const profession = await this.prisma.profession.findUnique({
      where: { id },
    });

    if (!profession) {
      throw new NotFoundException('Meslek/Unvan bulunamadı');
    }

    // İsim benzersizlik kontrolü
    if (dto.name && dto.name !== profession.name) {
      const existing = await this.prisma.profession.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new BadRequestException('Bu meslek/unvan zaten mevcut');
      }
    }

    return this.prisma.profession.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  /**
   * Meslek/Unvan sil (soft delete - isActive: false)
   */
  async deleteProfession(id: string) {
    const profession = await this.prisma.profession.findUnique({
      where: { id },
    });

    if (!profession) {
      throw new NotFoundException('Meslek/Unvan bulunamadı');
    }

    // Kullanımda olup olmadığını kontrol et
    const memberCount = await this.prisma.member.count({
      where: {
        professionId: id,
      },
    });

    if (memberCount > 0) {
      // Kullanımda ise soft delete
      return this.prisma.profession.update({
        where: { id },
        data: { isActive: false },
      });
    }

    // Kullanımda değilse hard delete
    return this.prisma.profession.delete({
      where: { id },
    });
  }
}

