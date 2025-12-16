import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InstitutionsService } from './institutions.service';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { UpdateInstitutionDto } from './dto/update-institution.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('Institutions')
@ApiBearerAuth('JWT-auth')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Permissions(Permission.INSTITUTION_CREATE)
  @Post()
  @ApiOperation({ summary: 'Yeni kurum oluştur', description: 'İl/İlçe başkanları kurum ekleyebilir, admin onayı olmadan aktif olmaz' })
  @ApiResponse({ status: 201, description: 'Kurum oluşturuldu (onay bekliyor)' })
  create(
    @Body() createInstitutionDto: CreateInstitutionDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.institutionsService.create(createInstitutionDto, user);
  }

  @Permissions(Permission.INSTITUTION_LIST)
  @Get()
  @ApiOperation({ summary: 'Kurumları listele' })
  @ApiResponse({ status: 200, description: 'Kurum listesi' })
  findAll(@CurrentUser() user: CurrentUserData) {
    return this.institutionsService.findAll(user);
  }

  @Permissions(Permission.INSTITUTION_VIEW)
  @Get(':id')
  @ApiOperation({ summary: 'Kurum detayını getir' })
  @ApiResponse({ status: 200, description: 'Kurum detayı' })
  findOne(@Param('id') id: string) {
    return this.institutionsService.findOne(id);
  }

  @Permissions(Permission.INSTITUTION_UPDATE)
  @Patch(':id')
  @ApiOperation({ summary: 'Kurum bilgilerini güncelle', description: 'İl/İlçe başkanları için admin onayı gerekli' })
  @ApiResponse({ status: 200, description: 'Kurum güncellendi' })
  update(
    @Param('id') id: string,
    @Body() updateInstitutionDto: UpdateInstitutionDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.institutionsService.update(id, updateInstitutionDto, user);
  }

  @Permissions(Permission.INSTITUTION_APPROVE)
  @Post(':id/approve')
  @ApiOperation({ summary: 'Kurum onayını ver', description: 'Admin tarafından kurum onaylanır' })
  @ApiResponse({ status: 200, description: 'Kurum onaylandı' })
  approve(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.institutionsService.approve(id, user.userId);
  }

  @Permissions(Permission.INSTITUTION_APPROVE)
  @Post(':id/reject')
  @ApiOperation({ summary: 'Kurum başvurusunu reddet', description: 'Admin tarafından kurum reddedilir' })
  @ApiResponse({ status: 200, description: 'Kurum reddedildi' })
  reject(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.institutionsService.reject(id, user.userId);
  }

  @Permissions(Permission.INSTITUTION_UPDATE)
  @Delete(':id')
  @ApiOperation({ summary: 'Kurumu sil' })
  @ApiResponse({ status: 200, description: 'Kurum silindi' })
  remove(@Param('id') id: string) {
    return this.institutionsService.remove(id);
  }
}
