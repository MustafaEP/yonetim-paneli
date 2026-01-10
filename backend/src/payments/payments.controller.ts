import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseInterceptors,
  UploadedFile,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreateMemberPaymentDto } from './dto/create-member-payment.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { PaymentType } from '@prisma/client';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Permissions(Permission.MEMBER_PAYMENT_ADD)
  @Post()
  @ApiOperation({ summary: 'Üye ödemesi oluştur', description: 'Muhasebe tarafından ödeme girişi yapılır' })
  @ApiResponse({ status: 201, description: 'Ödeme kaydı oluşturuldu' })
  async createPayment(
    @Body() dto: CreateMemberPaymentDto,
    @CurrentUser() user: CurrentUserData,
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    return this.paymentsService.createPayment(
      dto,
      user.userId,
      ipAddress,
      userAgent,
    );
  }

  @Permissions(Permission.MEMBER_PAYMENT_LIST)
  @Get()
  @ApiOperation({ summary: 'Ödeme listesi', description: 'Filtreleme ile ödeme listesi' })
  @ApiResponse({ status: 200, description: 'Ödeme listesi' })
  async listPayments(
    @Query('memberId') memberId?: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('paymentType') paymentType?: PaymentType,
    @Query('tevkifatCenterId') tevkifatCenterId?: string,
    @Query('branchId') branchId?: string,
    @Query('provinceId') provinceId?: string,
    @Query('districtId') districtId?: string,
    @Query('isApproved') isApproved?: boolean,
    @Query('registrationNumber') registrationNumber?: string,
  ) {
    return this.paymentsService.listPayments({
      memberId,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      paymentType,
      tevkifatCenterId,
      branchId,
      provinceId,
      districtId,
      isApproved: isApproved !== undefined ? isApproved === true : undefined,
      registrationNumber,
    });
  }

  @Permissions(Permission.MEMBER_PAYMENT_LIST)
  @Get('member/:memberId')
  @ApiOperation({ summary: 'Üye ödemeleri', description: 'Belirli bir üyenin ödemeleri' })
  @ApiResponse({ status: 200, description: 'Üye ödemeleri' })
  async getMemberPayments(@Param('memberId') memberId: string) {
    return this.paymentsService.getMemberPayments(memberId);
  }

  @Permissions(Permission.MEMBER_PAYMENT_VIEW)
  @Get(':id')
  @ApiOperation({ summary: 'Ödeme detayı', description: 'Ödeme kaydı detayları' })
  @ApiResponse({ status: 200, description: 'Ödeme detayı' })
  async getPaymentById(@Param('id') id: string) {
    return this.paymentsService.getPaymentById(id);
  }

  @Permissions(Permission.MEMBER_PAYMENT_APPROVE)
  @Post(':id/approve')
  @ApiOperation({ summary: 'Ödemeyi onayla', description: 'Admin tarafından ödeme onayı' })
  @ApiResponse({ status: 200, description: 'Ödeme onaylandı' })
  async approvePayment(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.paymentsService.approvePayment(id, user.userId);
  }

  @Permissions(Permission.MEMBER_PAYMENT_APPROVE)
  @Delete(':id')
  @ApiOperation({ summary: 'Ödemeyi sil', description: 'Onaysız ödemeleri silme (Admin)' })
  @ApiResponse({ status: 200, description: 'Ödeme silindi' })
  async deletePayment(@Param('id') id: string) {
    return this.paymentsService.deletePayment(id);
  }

  @Permissions(Permission.ACCOUNTING_VIEW)
  @Get('accounting/list')
  @ApiOperation({ summary: 'Muhasebe ödeme listesi', description: 'Excel/PDF export için ödeme listesi' })
  @ApiResponse({ status: 200, description: 'Muhasebe ödeme listesi' })
  async getPaymentsForAccounting(
    @Query('branchId') branchId?: string,
    @Query('tevkifatCenterId') tevkifatCenterId?: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Query('isApproved') isApproved?: boolean,
  ) {
    return this.paymentsService.getPaymentsForAccounting({
      branchId,
      tevkifatCenterId,
      year: year ? Number(year) : undefined,
      month: month ? Number(month) : undefined,
      isApproved: isApproved !== undefined ? isApproved === true : undefined,
    });
  }

  @Permissions(Permission.MEMBER_PAYMENT_ADD)
  @Post('upload-document')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Ödeme evrakı yükle', description: 'Ödeme için PDF evrak yükleme' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        memberId: {
          type: 'string',
        },
        paymentPeriodMonth: {
          type: 'number',
        },
        paymentPeriodYear: {
          type: 'number',
        },
        fileName: {
          type: 'string',
          description: 'Özel dosya adı (opsiyonel)',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Dosya yüklendi' })
  async uploadPaymentDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('memberId') memberId: string,
    @Body('paymentPeriodMonth') paymentPeriodMonth: string,
    @Body('paymentPeriodYear') paymentPeriodYear: string,
    @Body('fileName') fileName?: string,
  ) {
    return this.paymentsService.uploadPaymentDocument(
      file,
      memberId,
      Number(paymentPeriodMonth),
      Number(paymentPeriodYear),
      fileName,
    );
  }

  @Permissions(Permission.MEMBER_PAYMENT_VIEW)
  @Get(':id/document/view')
  @ApiOperation({ summary: 'Ödeme belgesi görüntüle', description: 'Ödeme belgesini yeni sekmede aç' })
  @ApiParam({ name: 'id', description: 'Ödeme ID' })
  @ApiResponse({ status: 200, description: 'Dosya görüntüleniyor' })
  @ApiResponse({ status: 404, description: 'Ödeme veya belge bulunamadı' })
  async viewPaymentDocument(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    await this.paymentsService.viewPaymentDocument(id, res);
  }

  @Permissions(Permission.MEMBER_PAYMENT_VIEW)
  @Get(':id/document/download')
  @ApiOperation({ summary: 'Ödeme belgesi indir', description: 'Ödeme belgesini indir' })
  @ApiParam({ name: 'id', description: 'Ödeme ID' })
  @ApiResponse({ status: 200, description: 'Dosya indiriliyor' })
  @ApiResponse({ status: 404, description: 'Ödeme veya belge bulunamadı' })
  async downloadPaymentDocument(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    await this.paymentsService.downloadPaymentDocument(id, res);
  }
}
