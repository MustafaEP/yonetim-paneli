import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContentType, ContentStatus } from '@prisma/client';

export class UpdateContentDto {
  @ApiProperty({ required: false, description: 'İçerik başlığı' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false, description: 'İçerik metni' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ enum: ContentType, required: false, description: 'İçerik türü' })
  @IsEnum(ContentType)
  @IsOptional()
  type?: ContentType;

  @ApiProperty({ enum: ContentStatus, required: false, description: 'İçerik durumu' })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;
}

