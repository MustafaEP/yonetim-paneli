import { ApiProperty } from '@nestjs/swagger';

export class CreateProvinceDto {
  @ApiProperty({
    description: 'İl adı',
    example: 'İstanbul',
    type: String,
  })
  name: string;

  @ApiProperty({
    description: 'İl kodu',
    example: '34',
    type: String,
    required: false,
  })
  code?: string;
}
