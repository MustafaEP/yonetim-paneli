import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentDto, UpdateContentDto } from './dto';
import { ContentType, ContentStatus } from '@prisma/client';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async findAll(params?: { type?: ContentType; status?: ContentStatus }) {
    return this.prisma.content.findMany({
      where: {
        ...(params?.type && { type: params.type }),
        ...(params?.status && { status: params.status }),
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException('İçerik bulunamadı');
    }

    return content;
  }

  async create(dto: CreateContentDto, authorId: string) {
    return this.prisma.content.create({
      data: {
        ...dto,
        authorId,
        status: dto.status || ContentStatus.DRAFT,
      },
      include: {
        author: {
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

  async update(id: string, dto: UpdateContentDto) {
    const content = await this.findOne(id);

    return this.prisma.content.update({
      where: { id },
      data: dto,
      include: {
        author: {
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

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.content.delete({ where: { id } });
  }

  async publish(id: string) {
    const content = await this.findOne(id);

    return this.prisma.content.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: {
        author: {
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

