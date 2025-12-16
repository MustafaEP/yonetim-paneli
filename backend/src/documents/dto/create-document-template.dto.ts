import { IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentTemplateType } from '@prisma/client';

export class CreateDocumentTemplateDto {
  @ApiProperty({ description: 'Şablon adı' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Şablon açıklaması' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Şablon içeriği (HTML/Markdown)' })
  @IsString()
  template: string;

  @ApiProperty({ enum: DocumentTemplateType, description: 'Şablon tipi' })
  @IsEnum(DocumentTemplateType)
  type: DocumentTemplateType;

  @ApiPropertyOptional({ description: 'Aktif mi?' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
