import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppService } from './whatsapp.service';
import { MessageDirection, WhatsAppMessageStatus } from '@prisma/client';

@Injectable()
export class WhatsAppChatService {
  private readonly logger = new Logger(WhatsAppChatService.name);

  constructor(
    private prisma: PrismaService,
    private whatsAppService: WhatsAppService,
  ) {}

  /**
   * JID'yi standart formata normalize et.
   * WAHA @c.us gonderir, biz @s.whatsapp.net olarak saklariz.
   * Her iki format da ayni kisiye isaret eder.
   */
  private normalizeJid(jid: string): string {
    return jid.replace('@c.us', '@s.whatsapp.net');
  }

  /**
   * JID'den telefon numarasini cikar (@c.us ve @s.whatsapp.net destekli)
   */
  private extractPhoneFromJid(jid: string): string {
    return jid.replace(/@(s\.whatsapp\.net|c\.us)$/, '');
  }

  /**
   * Konusma listesi (paginated, searchable)
   */
  async getConversations(params: {
    search?: string;
    isArchived?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const { search, isArchived = false, limit = 50, offset = 0 } = params;

    const where: any = { isArchived };

    if (search) {
      where.OR = [
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search } },
        { lastMessage: { contains: search, mode: 'insensitive' } },
        {
          member: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.whatsAppConversation.findMany({
        where,
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              status: true,
            },
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.whatsAppConversation.count({ where }),
    ]);

    return { data, total };
  }

  /**
   * Tek konusma detayi
   */
  async getConversation(id: string) {
    return this.prisma.whatsAppConversation.findUnique({
      where: { id },
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            province: { select: { name: true } },
            district: { select: { name: true } },
          },
        },
      },
    });
  }

  /**
   * Konusma mesajlari (paginated, cursor-based)
   */
  async getMessages(
    conversationId: string,
    params: { limit?: number; before?: string },
  ) {
    const { limit = 50, before } = params;

    const where: any = { conversationId };
    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    const [data, total] = await Promise.all([
      this.prisma.whatsAppMessage.findMany({
        where,
        include: {
          sentBy: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.whatsAppMessage.count({ where: { conversationId } }),
    ]);

    return { data: data.reverse(), total };
  }

  /**
   * Konusmaya mesaj gonder
   */
  async sendMessage(
    conversationId: string,
    content: string,
    sentById: string,
  ) {
    const conversation = await this.prisma.whatsAppConversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // WAHA uzerinden gonder - hata olursa mesaji FAILED olarak kaydet
    let result: { messageId: string } | null = null;
    let status: WhatsAppMessageStatus = WhatsAppMessageStatus.SENT;
    let errorMessage: string | null = null;

    try {
      result = await this.whatsAppService.sendText(
        conversation.remoteJid,
        content,
      );
      if (!result) {
        status = WhatsAppMessageStatus.FAILED;
        errorMessage = 'WhatsApp gönderimi devre dışı';
      }
    } catch (error: any) {
      status = WhatsAppMessageStatus.FAILED;
      errorMessage = error.message || 'Bilinmeyen hata';
      this.logger.error(
        `Failed to send message to ${conversation.remoteJid}: ${error.message}`,
      );
    }

    // Mesaji DB'ye kaydet (basarili veya basarisiz)
    const message = await this.prisma.whatsAppMessage.create({
      data: {
        conversationId,
        whatsappMsgId: result?.messageId || null,
        direction: MessageDirection.OUTBOUND,
        content,
        status,
        errorMessage,
        sentById,
        sentAt: new Date(),
      },
      include: {
        sentBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Konusmayi guncelle
    await this.prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
    });

    return message;
  }

  /**
   * Telefon numarasina direkt mesaj gonder (konusma yoksa olusturur)
   */
  async sendMessageToPhone(
    phone: string,
    content: string,
    sentById: string,
  ) {
    const formattedPhone = this.whatsAppService.formatPhoneForWhatsApp(phone);
    const remoteJid = `${formattedPhone}@s.whatsapp.net`;

    const conversation = await this.findOrCreateConversation(
      remoteJid,
      formattedPhone,
    );

    return this.sendMessage(conversation.id, content, sentById);
  }

  /**
   * Toplu mesaj gonder (uye filtresiyle)
   */
  async sendBulkMessage(params: {
    message: string;
    sentById: string;
    memberFilter?: {
      provinceId?: string;
      districtId?: string;
      status?: string;
      branchId?: string;
    };
    memberIds?: string[];
  }) {
    const { message, sentById, memberFilter, memberIds } = params;

    // Uyeleri filtrele
    const where: any = { isActive: true };

    if (memberIds?.length) {
      where.id = { in: memberIds };
    } else if (memberFilter) {
      if (memberFilter.provinceId)
        where.provinceId = memberFilter.provinceId;
      if (memberFilter.districtId)
        where.districtId = memberFilter.districtId;
      if (memberFilter.status) where.status = memberFilter.status;
      if (memberFilter.branchId) where.branchId = memberFilter.branchId;
    }

    const members = await this.prisma.member.findMany({
      where,
      select: { id: true, phone: true, firstName: true, lastName: true },
    });

    let sent = 0;
    let failed = 0;
    const failedMembers: {
      memberId: string;
      name: string;
      phone: string;
      error: string;
    }[] = [];

    // Güvenli gönderim limiti: mesajlar arası 3-5 saniye rastgele bekleme
    for (const member of members) {
      try {
        await this.sendMessageToPhone(member.phone, message, sentById);
        sent++;
        // Rate limiting: WhatsApp anti-spam koruması (3-5 saniye rastgele)
        const delay = 3000 + Math.random() * 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      } catch (error: any) {
        failed++;
        failedMembers.push({
          memberId: member.id,
          name: `${member.firstName} ${member.lastName}`,
          phone: member.phone,
          error: error.message || 'Bilinmeyen hata',
        });
        this.logger.error(
          `Failed to send bulk message to ${member.phone}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `Bulk WhatsApp: ${sent} sent, ${failed} failed out of ${members.length}`,
    );

    return { sent, failed, total: members.length, failedMembers };
  }

  /**
   * Konusmayi okundu olarak isaretle
   */
  async markConversationRead(conversationId: string) {
    await this.prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });
  }

  /**
   * Konusmayi arsivle
   */
  async archiveConversation(conversationId: string, archive = true) {
    await this.prisma.whatsAppConversation.update({
      where: { id: conversationId },
      data: { isArchived: archive },
    });
  }

  /**
   * Toplam okunmamis mesaj sayisi
   */
  async getTotalUnreadCount(): Promise<number> {
    const result = await this.prisma.whatsAppConversation.aggregate({
      _sum: { unreadCount: true },
      where: { isArchived: false },
    });
    return result._sum.unreadCount || 0;
  }

  /**
   * Konusma bul veya olustur. Telefon numarasindan uye eslestirmesi yapar.
   * JID normalize edilir: @c.us ve @s.whatsapp.net ayni kisi olarak islenir.
   */
  async findOrCreateConversation(remoteJid: string, phone?: string) {
    const normalized = this.normalizeJid(remoteJid);

    // Hem normalize edilmis hem orijinal JID ile ara
    let conversation =
      await this.prisma.whatsAppConversation.findFirst({
        where: {
          remoteJid: { in: [normalized, remoteJid] },
        },
      });

    if (conversation) {
      // Eski @c.us formatindaki kaydi @s.whatsapp.net'e guncelle
      if (conversation.remoteJid !== normalized) {
        conversation = await this.prisma.whatsAppConversation.update({
          where: { id: conversation.id },
          data: { remoteJid: normalized },
        });
      }
      return conversation;
    }

    // Telefon numarasindan uye eslestirmesi
    const normalizedPhone = phone || this.extractPhoneFromJid(remoteJid);
    const member = await this.findMemberByPhone(normalizedPhone);

    conversation = await this.prisma.whatsAppConversation.create({
      data: {
        remoteJid: normalized,
        contactPhone: normalizedPhone,
        contactName: member
          ? `${member.firstName} ${member.lastName}`
          : null,
        memberId: member?.id || null,
      },
    });

    return conversation;
  }

  /**
   * Gelen mesaji isle (webhook'tan cagirilir)
   */
  async processIncomingMessage(data: {
    remoteJid: string;
    messageId: string;
    content: string;
    pushName?: string;
  }) {
    const { remoteJid, messageId, content, pushName } = data;

    // Dedup: ayni mesaj ID'si zaten varsa atla
    const existing = await this.prisma.whatsAppMessage.findUnique({
      where: { whatsappMsgId: messageId },
    });
    if (existing) return existing;

    const phone = this.extractPhoneFromJid(remoteJid);
    const conversation = await this.findOrCreateConversation(
      remoteJid,
      phone,
    );

    // pushName varsa ve contactName yoksa guncelle
    if (pushName && !conversation.contactName) {
      await this.prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: { contactName: pushName },
      });
    }

    // Mesaji kaydet
    const message = await this.prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        whatsappMsgId: messageId,
        direction: MessageDirection.INBOUND,
        content,
        status: WhatsAppMessageStatus.DELIVERED,
        sentAt: new Date(),
      },
    });

    // Konusmayi guncelle
    await this.prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    this.logger.log(`Incoming WhatsApp message from ${phone}: ${messageId}`);

    return message;
  }

  /**
   * Mesaj durumunu guncelle (delivered, read)
   */
  async updateMessageStatus(
    messageId: string,
    status: WhatsAppMessageStatus,
  ) {
    const message = await this.prisma.whatsAppMessage.findUnique({
      where: { whatsappMsgId: messageId },
    });

    if (!message) return;

    const updateData: any = { status };
    if (status === WhatsAppMessageStatus.DELIVERED) {
      updateData.deliveredAt = new Date();
    } else if (status === WhatsAppMessageStatus.READ) {
      updateData.readAt = new Date();
    }

    await this.prisma.whatsAppMessage.update({
      where: { id: message.id },
      data: updateData,
    });
  }

  /**
   * Telefon numarasindan uye bul (cesitli formatlarla)
   */
  private async findMemberByPhone(phone: string) {
    const cleanPhone = phone.replace(/\D/g, '');

    // Farkli formatlarda dene
    const phoneVariants = [
      cleanPhone,
      cleanPhone.startsWith('90')
        ? '0' + cleanPhone.substring(2)
        : cleanPhone,
      cleanPhone.startsWith('90') ? cleanPhone.substring(2) : cleanPhone,
      '+' + cleanPhone,
    ];

    return this.prisma.member.findFirst({
      where: {
        phone: { in: phoneVariants },
        isActive: true,
      },
      select: { id: true, firstName: true, lastName: true, phone: true },
    });
  }
}
