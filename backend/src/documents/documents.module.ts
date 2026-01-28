import { Module } from '@nestjs/common';
import { DocumentsController } from './presentation/controllers/documents.controller';
import { DocumentsService } from './documents.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfService } from './services/pdf.service';
import { FileStorageService } from './services/file-storage.service';
import { DocumentTemplateApplicationService } from './application/services/document-template-application.service';
import { PrismaDocumentTemplateRepository } from './infrastructure/persistence/prisma-document-template.repository';
import { DocumentTemplateRepository } from './domain/repositories/document.repository.interface';
import { DocumentExceptionFilter } from './presentation/filters/document-exception.filter';
import { DocumentValidationPipe } from './presentation/pipes/document-validation.pipe';

@Module({
  imports: [PrismaModule],
  providers: [
    DocumentsService,
    PdfService,
    FileStorageService,
    DocumentTemplateApplicationService,
    {
      provide: 'DocumentTemplateRepository',
      useClass: PrismaDocumentTemplateRepository,
    },
    PrismaDocumentTemplateRepository,
    DocumentExceptionFilter,
    DocumentValidationPipe,
  ],
  controllers: [DocumentsController],
  exports: [DocumentsService, PdfService, FileStorageService],
})
export class DocumentsModule {}
