import { IsString, IsNotEmpty, IsEnum, IsOptional, ValidateIf, IsObject } from 'class-validator';
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

  @ApiProperty({ description: 'Hedef ID (REGION veya SCOPE için zorunlu)', required: false })
  @ValidateIf((o) => o.targetType === NotificationTargetType.REGION || o.targetType === NotificationTargetType.SCOPE)
  @IsString()
  @IsNotEmpty()
  targetId?: string;

  @ApiProperty({ description: 'Ek bilgiler (metadata)', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

