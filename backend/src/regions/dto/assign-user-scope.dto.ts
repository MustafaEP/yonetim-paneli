import { ApiProperty } from '@nestjs/swagger';

export class AssignUserScopeDto {
  @ApiProperty({
    description: 'Kullanıcı ID',
    example: 'user-uuid-123',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'İl ID (İl Başkanı için)',
    example: 'province-uuid-123',
    type: String,
    required: false,
  })
  provinceId?: string;

  @ApiProperty({
    description: 'İlçe ID (İlçe Temsilcisi için)',
    example: 'district-uuid-456',
    type: String,
    required: false,
  })
  districtId?: string;

  @ApiProperty({
    description: 'İş yeri ID (İş Yeri Temsilcisi için)',
    example: 'workplace-uuid-789',
    type: String,
    required: false,
  })
  workplaceId?: string;

  @ApiProperty({
    description: 'Bayi ID (Bayi Yetkilisi için)',
    example: 'dealer-uuid-012',
    type: String,
    required: false,
  })
  dealerId?: string;
}
