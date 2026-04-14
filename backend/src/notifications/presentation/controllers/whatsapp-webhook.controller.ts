import {
  Controller,
  Post,
  Body,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '../../../auth/decorators/public.decorator';
import { WhatsAppChatService } from '../../services/whatsapp-chat.service';
import { WhatsAppMessageStatus } from '@prisma/client';

@ApiTags('WhatsApp Webhook')
@Controller('whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(private readonly chatService: WhatsAppChatService) {}

  /**
   * WAHA webhook endpoint'i
   * Event formati: { event: string, session: string, payload: any }
   */
  @Post('webhook')
  @Public()
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleWebhook(@Body() body: any) {
    const event = body?.event;

    this.logger.debug(
      `Webhook received: event=${event}, keys=${Object.keys(body || {}).join(',')}`,
    );

    if (!event) {
      return { received: true };
    }

    try {
      switch (event) {
        case 'message':
          await this.handleIncomingMessage(body);
          break;

        case 'message.ack':
          await this.handleMessageAck(body);
          break;

        case 'session.status':
          this.handleSessionStatus(body);
          break;

        default:
          this.logger.debug(`Unhandled webhook event: ${event}`);
      }
    } catch (error: any) {
      this.logger.error(
        `Webhook processing error (${event}): ${error.message}`,
        error.stack,
      );
    }

    return { received: true };
  }

  /**
   * Gelen mesajlari isle
   * WAHA payload: { id, from, to, body, fromMe, ... }
   */
  private async handleIncomingMessage(body: any) {
    const payload = body?.payload;
    if (!payload) {
      this.logger.warn('Incoming message: no payload');
      return;
    }

    this.logger.log(
      `Incoming message: from=${payload.from}, fromMe=${payload.fromMe}, hasBody=${!!payload.body}, id=${typeof payload.id === 'object' ? JSON.stringify(payload.id) : payload.id}`,
    );

    // Kendi gonderdigimiz mesajlari atla
    if (payload.fromMe) return;

    const remoteJid = payload.from;
    if (!remoteJid) {
      this.logger.warn('Incoming message: no from field');
      return;
    }

    // Status mesajlarini ve grup mesajlarini atla
    if (
      remoteJid === 'status@broadcast' ||
      remoteJid.includes('@g.us') ||
      remoteJid.includes('@newsletter')
    ) {
      return;
    }

    // Mesaj icerigini cikar (metin, emoji, medya aciklamasi vb.)
    const msgType = payload.type || payload._data?.type || 'chat';
    let content = payload.body || '';

    // Medya/sticker/belge mesajlarinda body bos olabilir - tip bilgisi ekle
    if (!content) {
      switch (msgType) {
        case 'image':
          content = payload.caption || '📷 Fotoğraf';
          break;
        case 'video':
          content = payload.caption || '🎥 Video';
          break;
        case 'audio':
        case 'ptt':
          content = '🎵 Sesli mesaj';
          break;
        case 'sticker':
          content = '🏷️ Çıkartma';
          break;
        case 'document':
          content = payload.caption || `📄 ${payload._data?.filename || 'Belge'}`;
          break;
        case 'location':
          content = '📍 Konum';
          break;
        case 'contact':
        case 'vcard':
          content = '👤 Kişi kartı';
          break;
        default:
          this.logger.warn(
            `Incoming message from ${remoteJid}: empty body, type=${msgType}`,
          );
          return;
      }
    }

    // messageId: WAHA string veya object donebilir
    const rawId = payload.id;
    const messageId =
      typeof rawId === 'string'
        ? rawId
        : rawId?._serialized || rawId?.id || String(rawId);

    const pushName = payload._data?.notifyName || payload.notifyName || null;

    this.logger.log(
      `Processing incoming message from ${remoteJid}: messageId=${messageId}, content=${content.substring(0, 50)}`,
    );

    await this.chatService.processIncomingMessage({
      remoteJid,
      messageId,
      content,
      pushName,
    });
  }

  /**
   * Mesaj onay durumu (ack) guncelleme
   * WAHA ack degerleri: 1=SENT, 2=DELIVERED, 3=READ
   */
  private async handleMessageAck(body: any) {
    const payload = body?.payload;
    if (!payload?.id) return;

    const rawId = payload.id;
    const messageId =
      typeof rawId === 'string'
        ? rawId
        : rawId?._serialized || rawId?.id || String(rawId);
    const ack = payload.ack;

    let mappedStatus: WhatsAppMessageStatus | null = null;
    switch (ack) {
      case 1:
        mappedStatus = WhatsAppMessageStatus.SENT;
        break;
      case 2:
        mappedStatus = WhatsAppMessageStatus.DELIVERED;
        break;
      case 3:
        mappedStatus = WhatsAppMessageStatus.READ;
        break;
    }

    if (mappedStatus) {
      await this.chatService.updateMessageStatus(messageId, mappedStatus);
    }
  }

  /**
   * Session durum degisikligi
   */
  private handleSessionStatus(body: any) {
    const payload = body?.payload;
    this.logger.log(
      `WhatsApp session status: ${payload?.status || 'unknown'}`,
    );
  }
}
