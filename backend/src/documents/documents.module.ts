import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfService } from './services/pdf.service';
import { FileStorageService } from './services/file-storage.service';

@Module({
  imports: [PrismaModule],
  controllers: [DocumentsController],
  providers: [DocumentsService, PdfService, FileStorageService],
  exports: [DocumentsService, PdfService, FileStorageService],
})
export class DocumentsModule {}
