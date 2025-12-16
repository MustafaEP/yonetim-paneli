import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateInstitutionDto {
  @ApiProperty({
    description: 'Kurum adı',
    example: 'İstanbul Devlet Hastanesi',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'İl ID',
    example: 'province-uuid-123',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  provinceId: string;

  @ApiProperty({
    description: 'İlçe ID',
    example: 'district-uuid-123',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  districtId?: string;

  @ApiProperty({
    description: 'Bağlı olduğu şube ID',
    example: 'branch-uuid-123',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;
}
