import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateInstitutionDto {
  @ApiProperty({
    description: 'Kurum adı',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'İl ID',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  provinceId?: string;

  @ApiProperty({
    description: 'İlçe ID',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  districtId?: string;

  @ApiProperty({
    description: 'Bağlı olduğu şube ID',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  branchId?: string;
}
