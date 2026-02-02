/**
 * Prisma Member Repository Implementation
 * 
 * Infrastructure katmanı: Domain repository interface'ini implement eder.
 * 
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MemberRepository } from '../../domain/repositories/member.repository.interface';
import { Member } from '../../domain/entities/member.entity';
import { NationalId } from '../../domain/value-objects/national-id.vo';
import { MemberStatus } from '../../domain/value-objects/member-status.vo';

@Injectable()
export class PrismaMemberRepository implements MemberRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Member | null> {
    const data = await this.prisma.member.findUnique({
      where: { id },
      // ✅ Tam Member Entity için tüm alanları select et
    });

    if (!data) {
      return null;
    }

    // Prisma model → Domain Entity
    return Member.fromPrisma(data);
  }

  async save(member: Member): Promise<void> {
    const updateData = member.toPrismaUpdateData();

    await this.prisma.member.update({
      where: { id: member.id },
      data: updateData,
    });
  }

  async findByNationalId(nationalId: NationalId): Promise<Member | null> {
    const data = await this.prisma.member.findFirst({
      where: {
        nationalId: nationalId.getValue(),
        deletedAt: null,
        isActive: true,
      },
    });
    if (!data) return null;
    return Member.fromPrisma(data);
  }

  async findCancelledByNationalId(nationalId: NationalId): Promise<Member | null> {
    const data = await this.prisma.member.findFirst({
      where: {
        nationalId: nationalId.getValue(),
        status: {
          in: ['RESIGNED', 'EXPELLED', 'INACTIVE'],
        },
        deletedAt: null,
        isActive: true,
      },
      orderBy: {
        cancelledAt: 'desc',
      },
    });

    if (!data) {
      return null;
    }

    return Member.fromPrisma(data);
  }

  async findAllRegistrationNumbers(): Promise<string[]> {
    const members = await this.prisma.member.findMany({
      where: {
        registrationNumber: {
          not: {
            startsWith: 'TEMP-',
          },
        },
      },
      select: {
        registrationNumber: true,
      },
    });

    return members
      .map(m => m.registrationNumber)
      .filter((rn): rn is string => rn !== null);
  }

  async create(member: Member): Promise<Member> {
    const createData = member.toPrismaCreateData();
    
    // ID'yi kaldır (Prisma otomatik oluşturacak)
    delete createData.id;

    const created = await this.prisma.member.create({
      data: createData as any, // Type assertion - Prisma type'ı çok karmaşık, runtime'da doğru çalışacak
    });

    return Member.fromPrisma(created);
  }
}
