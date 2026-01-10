import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberGroupDto } from './dto/create-member-group.dto';
import { UpdateMemberGroupDto } from './dto/update-member-group.dto';

@Injectable()
export class MemberGroupsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Üye grubu listesini getir (sadece aktif olanlar)
   */
  async listMemberGroups() {
    return this.prisma.memberGroup.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Tüm üye gruplarını getir (aktif ve pasif)
   */
  async listAllMemberGroups() {
    return this.prisma.memberGroup.findMany({
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Üye grubu detayını getir
   */
  async getMemberGroupById(id: string) {
    const memberGroup = await this.prisma.memberGroup.findUnique({
      where: { id },
    });

    if (!memberGroup) {
      throw new NotFoundException('Üye grubu bulunamadı');
    }

    return memberGroup;
  }

  /**
   * Üye grubu oluştur
   */
  async createMemberGroup(dto: CreateMemberGroupDto) {
    // İsim benzersizlik kontrolü
    const existing = await this.prisma.memberGroup.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Bu üye grubu zaten mevcut');
    }

    // Eğer order belirtilmemişse, otomatik olarak en yüksek order + 1 ekle
    let order = dto.order;
    if (order === undefined || order === null) {
      const maxOrderResult = await this.prisma.memberGroup.findFirst({
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = maxOrderResult ? maxOrderResult.order + 1 : 0;
    }

    return this.prisma.memberGroup.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        order: order,
      },
    });
  }

  /**
   * Üye grubu güncelle
   */
  async updateMemberGroup(id: string, dto: UpdateMemberGroupDto) {
    const memberGroup = await this.prisma.memberGroup.findUnique({
      where: { id },
    });

    if (!memberGroup) {
      throw new NotFoundException('Üye grubu bulunamadı');
    }

    // İsim benzersizlik kontrolü
    if (dto.name && dto.name !== memberGroup.name) {
      const existing = await this.prisma.memberGroup.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new BadRequestException('Bu üye grubu zaten mevcut');
      }
    }

    return this.prisma.memberGroup.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description || null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  /**
   * Üye grubu sırasını güncelle (yukarı/aşağı taşıma)
   */
  async moveMemberGroup(id: string, direction: 'up' | 'down') {
    const memberGroup = await this.prisma.memberGroup.findUnique({
      where: { id },
    });

    if (!memberGroup) {
      throw new NotFoundException('Üye grubu bulunamadı');
    }

    // Sıralı listeyi al
    const allGroups = await this.prisma.memberGroup.findMany({
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });

    const currentIndex = allGroups.findIndex((g) => g.id === id);

    if (currentIndex === -1) {
      throw new NotFoundException('Üye grubu bulunamadı');
    }

    let targetIndex: number;
    if (direction === 'up') {
      targetIndex = currentIndex - 1;
      if (targetIndex < 0) {
        throw new BadRequestException('Üye grubu zaten en üstte');
      }
    } else {
      targetIndex = currentIndex + 1;
      if (targetIndex >= allGroups.length) {
        throw new BadRequestException('Üye grubu zaten en altta');
      }
    }

    const targetGroup = allGroups[targetIndex];

    // İki grubun sırasını değiştir
    await this.prisma.$transaction([
      this.prisma.memberGroup.update({
        where: { id },
        data: { order: targetGroup.order },
      }),
      this.prisma.memberGroup.update({
        where: { id: targetGroup.id },
        data: { order: memberGroup.order },
      }),
    ]);

    return this.prisma.memberGroup.findUnique({
      where: { id },
    });
  }

  /**
   * Üye grubu sil (soft delete - isActive: false)
   */
  async deleteMemberGroup(id: string) {
    const memberGroup = await this.prisma.memberGroup.findUnique({
      where: { id },
    });

    if (!memberGroup) {
      throw new NotFoundException('Üye grubu bulunamadı');
    }

    // Kullanımda olup olmadığını kontrol et
    const memberCount = await this.prisma.member.count({
      where: {
        memberGroupId: id,
      },
    });

    if (memberCount > 0) {
      // Kullanımda ise soft delete
      return this.prisma.memberGroup.update({
        where: { id },
        data: { isActive: false },
      });
    }

    // Kullanımda değilse hard delete
    return this.prisma.memberGroup.delete({
      where: { id },
    });
  }
}

