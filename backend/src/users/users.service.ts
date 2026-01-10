import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto, memberId?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already in use');
    }

    // Admin kullanıcı hariç tüm kullanıcılar bir üyeden gelmelidir
    let hasAdminRole = false;
    if (dto.customRoleIds && dto.customRoleIds.length > 0) {
      const roles = await this.prisma.customRole.findMany({
        where: {
          id: { in: dto.customRoleIds },
          deletedAt: null,
          isActive: true,
        },
      });

      // ADMIN rolü kontrolü
      hasAdminRole = roles.some(role => role.name === 'ADMIN');

      // ADMIN olmayan kullanıcılar için memberId zorunlu kontrolü
      if (!hasAdminRole && !memberId) {
        throw new BadRequestException('Admin kullanıcı hariç tüm panel kullanıcıları bir üyeden gelmelidir. Panel kullanıcı başvurusu onayı üzerinden oluşturulmalıdır.');
      }

      // MemberId sağlandıysa, member'ın var olduğunu ve zaten bir user'a bağlı olmadığını kontrol et
      if (memberId) {
        const member = await this.prisma.member.findUnique({
          where: { id: memberId },
        });
        if (!member) {
          throw new NotFoundException('Belirtilen üye bulunamadı.');
        }
        if (member.userId) {
          throw new ConflictException('Bu üye zaten bir panel kullanıcısına bağlı.');
        }
      }

      const hasScopeRestrictedRole = roles.some(role => role.hasScopeRestriction);
      
      if (hasScopeRestrictedRole) {
        if (!dto.scopes || dto.scopes.length === 0) {
          throw new BadRequestException('Seçilen rollerden biri yetki alanı kısıtlaması olan bir rol. Bu rol için yetki alanı seçimi zorunludur.');
        }

        // Her scope için validasyon
        for (const scope of dto.scopes) {
          if (!scope.provinceId && !scope.districtId) {
            throw new BadRequestException('Her yetki alanı için en az bir il veya ilçe seçmelisiniz.');
          }

          if (scope.districtId && !scope.provinceId) {
            throw new BadRequestException('İlçe seçmek için önce il seçmelisiniz.');
          }

          // İlçenin seçili ile ait olduğunu kontrol et
          if (scope.districtId && scope.provinceId) {
            const district = await this.prisma.district.findUnique({
              where: { id: scope.districtId },
            });
            if (district && district.provinceId !== scope.provinceId) {
              throw new BadRequestException('Seçilen ilçe, seçilen ile ait değil.');
            }
          }
        }
      }
    } else {
      // Rol yoksa ve ADMIN değilse, üye bağlantısı zorunludur
      if (!memberId) {
        throw new BadRequestException('Admin kullanıcı hariç tüm panel kullanıcıları bir üyeden gelmelidir. Panel kullanıcı başvurusu onayı üzerinden oluşturulmalıdır.');
      }

      // MemberId sağlandıysa, member'ın var olduğunu ve zaten bir user'a bağlı olmadığını kontrol et
      if (memberId) {
        const member = await this.prisma.member.findUnique({
          where: { id: memberId },
        });
        if (!member) {
          throw new NotFoundException('Belirtilen üye bulunamadı.');
        }
        if (member.userId) {
          throw new ConflictException('Bu üye zaten bir panel kullanıcısına bağlı.');
        }
      }
    }

    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
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

    // MemberId sağlandıysa, member'ı user'a bağla
    if (memberId) {
      await this.prisma.member.update({
        where: { id: memberId },
        data: { userId: user.id },
      });
    }

    // Scope'ları oluştur (çoklu scope desteği)
    if (dto.scopes && dto.scopes.length > 0) {
      await this.prisma.userScope.createMany({
        data: dto.scopes.map((scope) => ({
          userId: user.id,
          provinceId: scope.provinceId || null,
          districtId: scope.districtId || null,
        })),
      });
    } else if (dto.provinceId || dto.districtId) {
      // Geriye uyumluluk için (eski API)
      await this.prisma.userScope.create({
        data: {
          userId: user.id,
          provinceId: dto.provinceId || null,
          districtId: dto.districtId || null,
        },
      });
    }

    return user;
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
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              phone: true,
              email: true,
              status: true,
              registrationNumber: true,
            },
          },
        },
      });
    } catch (error: any) {
      // Eğer _UserCustomRoles tablosu yoksa, customRoles olmadan döndür
      if (error?.message?.includes('_UserCustomRoles') || error?.message?.includes('does not exist')) {
        return this.prisma.user.findFirst({
          where: { id },
          include: {
            member: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nationalId: true,
                phone: true,
                email: true,
                status: true,
                registrationNumber: true,
              },
            },
          },
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
