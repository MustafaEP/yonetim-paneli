import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { CreatePanelUserApplicationDto } from './dto/create-panel-user-application.dto';
import { ApprovePanelUserApplicationDto } from './dto/approve-panel-user-application.dto';
import { RejectPanelUserApplicationDto } from './dto/reject-panel-user-application.dto';

@Injectable()
export class PanelUserApplicationsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async create(
    memberId: string,
    dto: CreatePanelUserApplicationDto,
    requestedByUserId: string,
  ) {
    // Üyenin zaten bir başvurusu var mı kontrol et
    const existing = await this.prisma.panelUserApplication.findUnique({
      where: { memberId },
    });

    if (existing) {
      throw new ConflictException('Bu üye için zaten bir başvuru mevcut');
    }

    // Üye zaten panel kullanıcısı mı kontrol et
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!member) {
      throw new NotFoundException('Üye bulunamadı');
    }

    if (member.userId) {
      throw new ConflictException('Bu üye zaten panel kullanıcısı');
    }

    // Rol var mı kontrol et
    const role = await this.prisma.customRole.findUnique({
      where: { id: dto.requestedRoleId },
    });

    if (!role) {
      throw new NotFoundException('Seçilen rol bulunamadı');
    }

    // Yetki alanı kontrolü: Eğer role hasScopeRestriction true ise scope zorunlu
    if (role.hasScopeRestriction) {
      if (!dto.scopes || dto.scopes.length === 0) {
        throw new BadRequestException('Bu rol için yetki alanı seçimi zorunludur.');
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

    return this.prisma.panelUserApplication.create({
      data: {
        memberId,
        requestedRoleId: dto.requestedRoleId,
        requestNote: dto.requestNote,
        status: 'PENDING',
        applicationScopes: dto.scopes && dto.scopes.length > 0
          ? {
              create: dto.scopes.map((scope) => ({
                provinceId: scope.provinceId || null,
                districtId: scope.districtId || null,
              })),
            }
          : undefined,
      },
      include: {
        member: {
          include: {
            branch: true,
            institution: true,
          },
        },
        requestedRole: {
          include: {
            permissions: true,
            roleScopes: {
              where: {
                deletedAt: null,
              },
              include: {
                province: true,
                district: true,
              },
            },
          },
        },
        applicationScopes: {
          where: {
            deletedAt: null,
          },
          include: {
            province: true,
            district: true,
          },
        },
      },
    });
  }

  async findAll(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.panelUserApplication.findMany({
      where: status ? { status } : undefined,
      include: {
        member: {
          include: {
            branch: true,
            institution: true,
          },
        },
        requestedRole: {
          include: {
            permissions: true,
            roleScopes: {
              where: {
                deletedAt: null,
              },
              include: {
                province: true,
                district: true,
              },
            },
          },
        },
        applicationScopes: {
          where: {
            deletedAt: null,
          },
          include: {
            province: true,
            district: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    return this.prisma.panelUserApplication.findUnique({
      where: { id },
      include: {
        member: {
          include: {
            branch: true,
            institution: true,
          },
        },
        requestedRole: {
          include: {
            permissions: true,
            roleScopes: {
              where: {
                deletedAt: null,
              },
              include: {
                province: true,
                district: true,
              },
            },
          },
        },
        applicationScopes: {
          where: {
            deletedAt: null,
          },
          include: {
            province: true,
            district: true,
          },
        },
        reviewedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdUser: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async approve(
    id: string,
    dto: ApprovePanelUserApplicationDto,
    reviewedByUserId: string,
  ) {
    const application = await this.prisma.panelUserApplication.findUnique({
      where: { id },
      include: { 
        member: true,
        requestedRole: true,
        applicationScopes: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Başvuru bulunamadı');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException('Bu başvuru zaten işleme alınmış');
    }

    // Email kontrolü
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Bu email adresi zaten kullanılıyor');
    }

    // Yetki alanı kontrolü: Eğer role hasScopeRestriction true ise scope zorunlu
    // Admin scope'ları değiştirebilir (dto.scopes varsa onları kullan, yoksa başvurudaki scope'ları kullan)
    let scopesToUse = dto.scopes;
    
    if (application.requestedRole.hasScopeRestriction) {
      // Admin scope değiştirmişse onları kullan
      if (dto.scopes && dto.scopes.length > 0) {
        scopesToUse = dto.scopes;
      } else if (application.applicationScopes.length > 0) {
        // Başvurudaki scope'ları kullan
        scopesToUse = application.applicationScopes.map((scope) => ({
          provinceId: scope.provinceId ?? undefined,
          districtId: scope.districtId ?? undefined,
        }));
      } else {
        throw new BadRequestException('Bu rol için yetki alanı seçimi zorunludur.');
      }

      // Her scope için validasyon
      for (const scope of scopesToUse) {
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

    // User oluştur (scope'ları UserService'te UserScope olarak ekleyeceğiz)
    // memberId'yi geçirerek user'ı member'a bağla
    const newUser = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      firstName: application.member.firstName,
      lastName: application.member.lastName,
      customRoleIds: [application.requestedRoleId],
      scopes: scopesToUse,
    }, application.memberId); // memberId'yi geçir

    // Başvuruyu güncelle ve Member'a bağla
    // Eğer admin scope değiştirdiyse, başvurudaki scope'ları güncelle
    if (dto.scopes && dto.scopes.length > 0 && application.requestedRole.hasScopeRestriction) {
      // Mevcut scope'ları soft delete et
      await this.prisma.panelUserApplicationScope.updateMany({
        where: {
          applicationId: id,
          deletedAt: null,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      // Yeni scope'ları ekle
      await this.prisma.panelUserApplicationScope.createMany({
        data: dto.scopes.map((scope) => ({
          applicationId: id,
          provinceId: scope.provinceId || null,
          districtId: scope.districtId || null,
        })),
      });
    }

    await this.prisma.panelUserApplication.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy: reviewedByUserId,
        reviewedAt: new Date(),
        reviewNote: dto.reviewNote,
        createdUserId: newUser.id,
      },
    });

    // Member'ı User'a bağlama işlemi artık usersService.create() içinde yapılıyor

    return this.findById(id);
  }

  async reject(
    id: string,
    dto: RejectPanelUserApplicationDto,
    reviewedByUserId: string,
  ) {
    const application = await this.prisma.panelUserApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new NotFoundException('Başvuru bulunamadı');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException('Bu başvuru zaten işleme alınmış');
    }

    return this.prisma.panelUserApplication.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy: reviewedByUserId,
        reviewedAt: new Date(),
        reviewNote: dto.reviewNote,
      },
      include: {
        member: {
          include: {
            branch: true,
            institution: true,
          },
        },
        requestedRole: {
          include: {
            permissions: true,
          },
        },
        reviewedByUser: {
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

