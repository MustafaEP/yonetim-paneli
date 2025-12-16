import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContentType, ContentStatus } from '@prisma/client';

export class CreateContentDto {
  @ApiProperty({ description: 'İçerik başlığı' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'İçerik metni' })
  @IsString()
  content: string;

  @ApiProperty({ enum: ContentType, description: 'İçerik türü' })
  @IsEnum(ContentType)
  type: ContentType;

  @ApiProperty({ enum: ContentStatus, required: false, description: 'İçerik durumu' })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;
}

