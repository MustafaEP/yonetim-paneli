import { ApiProperty } from '@nestjs/swagger';
import { MemberSource } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMemberApplicationDto {
  @ApiProperty({
    description: 'Üye adı',
    example: 'Mehmet',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'Üye soyadı',
    example: 'Demir',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'TC Kimlik Numarası',
    example: '12345678901',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  nationalId?: string;

  @ApiProperty({
    description: 'Telefon numarası',
    example: '05551234567',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    description: 'E-posta adresi',
    example: 'mehmet.demir@example.com',
    type: String,
    required: false,
  })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Üyelik kaynağı',
    example: MemberSource.DIRECT,
    enum: MemberSource,
    required: false,
    default: MemberSource.DIRECT,
  })
  @IsOptional()
  source?: MemberSource;

  @ApiProperty({
    description: 'Aidat planı ID',
    example: 'plan-uuid-123',
    type: String,
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  duesPlanId: string;
}
