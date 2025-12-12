import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateMemberDuesPlanDto {
  @ApiProperty({
    description: 'Aidat planı ID',
    example: 'plan-uuid-123',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  duesPlanId: string;
}

