import { ApiProperty } from '@nestjs/swagger';

export class CreateDistrictDto {
  @ApiProperty({
    description: 'İlçe adı',
    example: 'Kadıköy',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'Bağlı olduğu il ID',
    example: 'province-uuid-123',
    type: String,
  })
  provinceId: string;
}
