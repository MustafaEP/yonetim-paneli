import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: hash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        customRoles: dto.customRoleIds && dto.customRoleIds.length > 0 
          ? {
              connect: dto.customRoleIds.map(id => ({ id })),
            }
          : undefined,
      },
      include: {
        customRoles: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customRoles: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: {
            permissions: true,
          },
        },
      },
    });
  }

  async findByEmail(email: string) {
    // Geçici: customRoles tablosu yoksa include etme
    try {
      return await this.prisma.user.findFirst({
        where: { email },
        include: {
          customRoles: {
            where: {
              deletedAt: null,
              isActive: true,
            },
            include: {
              permissions: true,
            },
          },
        },
      });
    } catch (error: any) {
      // Eğer _UserCustomRoles tablosu yoksa, customRoles olmadan döndür
      if (error?.message?.includes('_UserCustomRoles') || error?.message?.includes('does not exist')) {
        return this.prisma.user.findFirst({
          where: { email },
        });
      }
      throw error;
    }
  }

  async findById(id: string) {
    // Geçici: customRoles tablosu yoksa include etme
    try {
      return await this.prisma.user.findFirst({
        where: { id },
        include: {
          customRoles: {
            where: {
              deletedAt: null,
              isActive: true,
            },
            include: {
              permissions: true,
            },
          },
        },
      });
    } catch (error: any) {
      // Eğer _UserCustomRoles tablosu yoksa, customRoles olmadan döndür
      if (error?.message?.includes('_UserCustomRoles') || error?.message?.includes('does not exist')) {
        return this.prisma.user.findFirst({
          where: { id },
        });
      }
      throw error;
    }
  }

  async updateUserRoles(userId: string, customRoleIds: string[]) {
    // Önce kullanıcının var olduğunu kontrol et
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Tüm mevcut rolleri kaldır ve yenilerini ata
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        customRoles: {
          set: customRoleIds.map(id => ({ id })),
        },
      },
      include: {
        customRoles: {
          where: {
            deletedAt: null,
            isActive: true,
          },
          include: {
            permissions: true,
          },
        },
      },
    });
  }
}
