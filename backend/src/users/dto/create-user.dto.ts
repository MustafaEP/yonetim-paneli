import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Kullanıcı e-posta adresi',
    example: 'user@example.com',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'Kullanıcı şifresi',
    example: 'password123',
    type: String,
    format: 'password',
    minLength: 6,
  })
  password: string;

  @ApiProperty({
    description: 'Kullanıcı adı',
    example: 'Ahmet',
    type: String,
  })
  firstName: string;

  @ApiProperty({
    description: 'Kullanıcı soyadı',
    example: 'Yılmaz',
    type: String,
  })
  lastName: string;

  @ApiProperty({
    description: 'Kullanıcı özel rol ID\'leri',
    example: ['role-id-1', 'role-id-2'],
    type: [String],
    required: false,
  })
  customRoleIds?: string[];
}
