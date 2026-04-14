import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/config.service';
import axios, { AxiosInstance } from 'axios';

export interface SendWhatsAppOptions {
  to: string;
  message: string;
}

export interface WhatsAppConnectionStatus {
  connected: boolean;
  state: string;
}

export interface WhatsAppQrCode {
  base64: string;
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private httpClient!: AxiosInstance;
  private apiUrl!: string;
  private apiKey!: string;
  private sessionName!: string;

  constructor(private configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      this.apiUrl =
        this.configService.getSystemSetting('WHATSAPP_WAHA_API_URL') ||
        this.configService.wahaApiUrl;
      this.apiKey =
        this.configService.getSystemSetting('WHATSAPP_WAHA_API_KEY') ||
        this.configService.wahaApiKey ||
        '';
      this.sessionName =
        this.configService.getSystemSetting('WHATSAPP_WAHA_SESSION_NAME') ||
        this.configService.wahaSessionName;

      this.httpClient = axios.create({
        baseURL: this.apiUrl,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'X-Api-Key': this.apiKey } : {}),
        },
      });
    } catch (error) {
      this.logger.error('Error initializing WAHA client:', error);
      this.apiUrl = '';
      this.apiKey = '';
      this.sessionName = 'default';
      this.httpClient = axios.create({ timeout: 30000 });
    }
  }

  async refreshConfig() {
    this.initializeClient();
  }

  /**
   * WAHA session olustur ve baslat.
   * FAILED/STOPPED durumlarini otomatik kurtarir.
   */
  async createInstance(): Promise<void> {
    try {
      const sessions = await this.httpClient.get('/api/sessions');
      const existing = sessions.data?.find(
        (s: any) => s.name === this.sessionName,
      );

      if (existing) {
        const st = existing.status;

        // Zaten QR bekliyor veya çalışıyor - birşey yapma
        if (st === 'SCAN_QR_CODE' || st === 'WORKING') {
          this.logger.log(
            `WAHA session '${this.sessionName}' already active (status: ${st})`,
          );
          return;
        }

        // FAILED veya STOPPED → session'i durdur ve temiz başlat
        if (st === 'FAILED' || st === 'STOPPED') {
          this.logger.log(
            `WAHA session '${this.sessionName}' is ${st}, restarting...`,
          );
          // Önce durdurmayı dene (hata olursa yoksay)
          try {
            await this.httpClient.post('/api/sessions/stop', {
              name: this.sessionName,
            });
          } catch {
            // zaten stopped olabilir
          }
          // Kısa bekleme
          await new Promise((r) => setTimeout(r, 1000));
        }

        // Session'i başlat
        await this.httpClient.post('/api/sessions/start', {
          name: this.sessionName,
        });
        this.logger.log(
          `WAHA session '${this.sessionName}' (re)started`,
        );
        return;
      }

      // Yeni session olustur
      await this.httpClient.post('/api/sessions/start', {
        name: this.sessionName,
        config: {
          webhooks: [
            {
              url: `${process.env.WAHA_WEBHOOK_URL || 'http://localhost:3000'}/whatsapp/webhook`,
              events: ['message', 'message.ack', 'session.status'],
            },
          ],
        },
      });
      this.logger.log(`WAHA session '${this.sessionName}' created`);
    } catch (error: any) {
      // 422 = session zaten var/çalışıyor
      if (error.response?.status === 422) {
        this.logger.log(
          `WAHA session '${this.sessionName}' already exists`,
        );
        return;
      }
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        this.logger.error('WAHA servisi erişilemez. Docker container çalışıyor mu?');
        throw new Error('WhatsApp servisi şu anda erişilemez. Docker Desktop ve WAHA container\'ının çalıştığından emin olun.');
      }
      this.logger.error(
        `Failed to create WAHA session: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * QR kodu al (base64 formatinda)
   */
  async getQrCode(
    retries = 3,
    delayMs = 2000,
  ): Promise<WhatsAppQrCode | null> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await this.httpClient.get(
          `/api/${this.sessionName}/auth/qr`,
          {
            params: { format: 'raw' },
          },
        );
        const data = response.data;

        if (data?.value) {
          return { base64: data.value };
        }

        this.logger.log(
          `QR code not ready yet (attempt ${attempt}/${retries})`,
        );

        if (attempt < retries) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error: any) {
        if (
          (error.response?.status === 404 ||
            error.response?.status === 422) &&
          attempt < retries
        ) {
          this.logger.log(
            `Session not ready for QR (attempt ${attempt}/${retries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        // Session WORKING veya QR mevcut degil - normal durum
        if (error.response?.status === 404 || error.response?.status === 422) {
          return null;
        }
        this.logger.error(`Failed to get QR code: ${error.message}`);
        throw error;
      }
    }

    return null;
  }

  /**
   * QR kodu base64 image olarak al.
   * Session SCAN_QR_CODE durumunda degilse null doner.
   */
  async getQrCodeImage(): Promise<string | null> {
    try {
      const response = await this.httpClient.get(
        `/api/${this.sessionName}/auth/qr`,
        {
          params: { format: 'image' },
          responseType: 'arraybuffer',
        },
      );

      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      return `data:image/png;base64,${base64}`;
    } catch (error: any) {
      // 404/422 = QR mevcut degil (session connected veya stopped)
      if (error.response?.status === 404 || error.response?.status === 422) {
        return null;
      }
      this.logger.error(`Failed to get QR image: ${error.message}`);
      return null;
    }
  }

  /**
   * Baglanti durumunu kontrol et
   */
  async getConnectionStatus(): Promise<WhatsAppConnectionStatus> {
    try {
      const response = await this.httpClient.get('/api/sessions');
      const session = response.data?.find(
        (s: any) => s.name === this.sessionName,
      );

      if (!session) {
        return { connected: false, state: 'STOPPED' };
      }

      return {
        connected: session.status === 'WORKING',
        state: session.status,
      };
    } catch (error: any) {
      this.logger.error(
        `Failed to get connection status: ${error.message}`,
      );
      return { connected: false, state: 'error' };
    }
  }

  /**
   * Session'i durdur (logout)
   */
  async disconnectInstance(): Promise<void> {
    try {
      await this.httpClient.post('/api/sessions/logout', {
        name: this.sessionName,
      });
      this.logger.log(
        `WAHA session '${this.sessionName}' disconnected`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to disconnect WAHA session: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Metin mesaji gonder
   */
  async sendText(
    to: string,
    message: string,
  ): Promise<{ messageId: string } | null> {
    const whatsappEnabled = this.configService.getSystemSettingBoolean(
      'NOTIFICATION_WHATSAPP_ENABLED',
      true,
    );
    const globalEnabled = this.configService.getSystemSettingBoolean(
      'WHATSAPP_ENABLED',
      true,
    );

    if (!whatsappEnabled) {
      this.logger.warn(
        'WhatsApp notifications are disabled in notification settings.',
      );
      return null;
    }

    if (!globalEnabled) {
      this.logger.warn('WhatsApp sending is disabled in system settings.');
      return null;
    }

    const chatId = this.formatChatId(to);

    try {
      const response = await this.httpClient.post('/api/sendText', {
        session: this.sessionName,
        chatId,
        text: message,
      });

      // WAHA returns id as object {fromMe, remote, id, _serialized}
      const rawId = response.data?.id;
      const messageId =
        typeof rawId === 'string'
          ? rawId
          : rawId?._serialized || rawId?.id || String(rawId);
      this.logger.log(
        `WhatsApp message sent to ${chatId}. MessageId: ${messageId}`,
      );

      return { messageId };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        // Bağlantı hatası (WAHA çalışmıyor)
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          this.logger.error('WAHA servisi erişilemez. Docker container çalışıyor mu?');
          throw new Error('WhatsApp servisi şu anda erişilemez. Lütfen WAHA servisinin çalıştığından emin olun.');
        }
        // Session FAILED veya STOPPED
        const wahaError = error.response?.data;
        if (error.response?.status === 422 && wahaError?.status) {
          this.logger.error(`WAHA session durumu: ${wahaError.status}`);
          throw new Error(
            `WhatsApp bağlantısı aktif değil (durum: ${wahaError.status}). Ayarlar sayfasından yeniden bağlanın.`,
          );
        }
        this.logger.error(
          `WAHA API error: ${error.message} - ${JSON.stringify(wahaError)}`,
        );
        throw new Error(`WhatsApp API hatası: ${wahaError?.error || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Toplu metin mesaji gonder
   */
  async sendBulkText(messages: SendWhatsAppOptions[]): Promise<{
    sent: number;
    failed: number;
  }> {
    const results = await Promise.allSettled(
      messages.map((msg) => this.sendText(msg.to, msg.message)),
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    if (failed > 0) {
      this.logger.warn(
        `${failed} WhatsApp messages failed to send out of ${messages.length}`,
      );
    }

    return { sent, failed };
  }

  /**
   * Telefon numarasini WAHA chatId formatina cevir
   * Turkiye numaralari: 05XX -> 905XX@c.us
   */
  formatChatId(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');

    let phoneNumber = cleanPhone;
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '90' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('90')) {
      phoneNumber = '90' + phoneNumber;
    }

    // @c.us zaten varsa ekleme
    if (phoneNumber.includes('@')) {
      return phoneNumber;
    }

    return `${phoneNumber}@c.us`;
  }

  /**
   * Eski formatPhoneForWhatsApp uyumlulugu (sadece numara doner)
   */
  formatPhoneForWhatsApp(phone: string): string {
    const cleanPhone = phone.replace(/\D/g, '');

    let phoneNumber = cleanPhone;
    if (phoneNumber.startsWith('0')) {
      phoneNumber = '90' + phoneNumber.substring(1);
    } else if (!phoneNumber.startsWith('90')) {
      phoneNumber = '90' + phoneNumber;
    }

    return phoneNumber;
  }
}
