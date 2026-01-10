import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateMemberGroupDto {
  @ApiProperty({ description: 'Üye grubu adı', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiProperty({ description: 'Üye grubu açıklaması', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Aktiflik durumu', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Sıralama', required: false })
  @IsOptional()
  order?: number;
}

