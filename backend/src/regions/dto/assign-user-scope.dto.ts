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
}
