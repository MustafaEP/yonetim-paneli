import { ApiProperty } from '@nestjs/swagger';

export class CreateDealerDto {
  @ApiProperty({
    description: 'Bayi adı',
    example: 'İstanbul Bayi A.Ş.',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Bayi kodu',
    example: 'BAYI-001',
    type: String,
    required: false,
  })
  code?: string;

  @ApiProperty({
    description: 'Bayi adresi',
    example: 'Maslak Mahallesi, Büyükdere Caddesi No:100 Sarıyer/İstanbul',
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
