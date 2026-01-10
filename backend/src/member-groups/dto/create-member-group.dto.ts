import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateMemberGroupDto {
  @ApiProperty({ description: 'Üye grubu adı', example: 'Normal Üye' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ description: 'Üye grubu açıklaması', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Sıralama', required: false, default: 0 })
  @IsOptional()
  order?: number;
}

