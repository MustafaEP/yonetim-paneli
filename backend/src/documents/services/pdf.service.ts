import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  /**
   * HTML içeriğini PDF'e dönüştür
   */
  async generatePdfFromHtml(
    htmlContent: string,
    outputPath: string,
    options?: {
      format?: 'A4' | 'Letter';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
      printBackground?: boolean;
    },
  ): Promise<void> {
    let browser: puppeteer.Browser | null = null;

    try {
      // Browser'ı başlat
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      // HTML içeriğini yükle
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      });

      // PDF seçenekleri
      const pdfOptions: puppeteer.PDFOptions = {
        format: options?.format || 'A4',
        margin: options?.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: options?.printBackground !== false,
        preferCSSPageSize: false,
      };

      // Output dizinini oluştur
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // PDF'i oluştur ve kaydet
      await page.pdf({
        ...pdfOptions,
        path: outputPath,
      });

      this.logger.log(`PDF generated successfully: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Failed to generate PDF: ${error.message}`, error.stack);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * HTML içeriğini PDF buffer olarak döndür (dosyaya kaydetmeden)
   */
  async generatePdfBufferFromHtml(
    htmlContent: string,
    options?: {
      format?: 'A4' | 'Letter';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
      printBackground?: boolean;
    },
  ): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      await page.setContent(htmlContent, {
        waitUntil: 'networkidle0',
      });

      const pdfOptions: puppeteer.PDFOptions = {
        format: options?.format || 'A4',
        margin: options?.margin || {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm',
        },
        printBackground: options?.printBackground !== false,
        preferCSSPageSize: false,
      };

      const pdfBuffer = await page.pdf(pdfOptions);

      this.logger.log('PDF buffer generated successfully');
      // Puppeteer Uint8Array döndürür, Buffer'a dönüştür
      return Buffer.from(pdfBuffer);
    } catch (error) {
      this.logger.error(`Failed to generate PDF buffer: ${error.message}`, error.stack);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * HTML template'ini değişkenlerle doldur
   */
  replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let html = template;

    // {{variable}} formatındaki değişkenleri değiştir
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, this.escapeHtml(value));
    });

    return html;
  }

  /**
   * HTML escape (XSS koruması)
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}

