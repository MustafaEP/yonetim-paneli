import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkplaceDto {
  @ApiProperty({
    description: 'İş yeri adı',
    example: 'Kadıköy Şubesi',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'İş yeri adresi',
    example: 'Bağdat Caddesi No:123 Kadıköy/İstanbul',
    type: String,
    required: false,
  })
  address?: string;

  @ApiProperty({
    description: 'Bağlı olduğu il ID',
    example: 'province-uuid-123',
    type: String,
    required: false,
  })
  provinceId?: string;

  @ApiProperty({
    description: 'Bağlı olduğu ilçe ID',
    example: 'district-uuid-456',
    type: String,
    required: false,
  })
  districtId?: string;
}
