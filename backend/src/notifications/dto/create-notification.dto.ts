import { IsString, IsNotEmpty, IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType, NotificationTargetType } from '@prisma/client';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Bildirim başlığı' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Bildirim mesajı' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ description: 'Bildirim tipi', enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Hedef tip', enum: NotificationTargetType })
  @IsEnum(NotificationTargetType)
  targetType: NotificationTargetType;

  @ApiProperty({ description: 'Hedef ID (bölge veya scope için)', required: false })
  @IsString()
  @IsOptional()
  targetId?: string;
}

