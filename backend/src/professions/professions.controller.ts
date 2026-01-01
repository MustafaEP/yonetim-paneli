import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { ProfessionsService } from './professions.service';
import { CreateProfessionDto } from './dto/create-profession.dto';
import { UpdateProfessionDto } from './dto/update-profession.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';

@ApiTags('Professions')
@ApiBearerAuth('JWT-auth')
@Controller('professions')
export class ProfessionsController {
  constructor(private readonly professionsService: ProfessionsService) {}

  @Permissions(Permission.MEMBER_CREATE_APPLICATION, Permission.MEMBER_UPDATE)
  @Get()
  @ApiOperation({ summary: 'Meslek/Unvan listesini getir', description: 'Aktif meslek/unvanları listeler' })
  @ApiResponse({ status: 200, description: 'Meslek/Unvan listesi' })
  async listProfessions() {
    return this.professionsService.listProfessions();
  }

  @Permissions(Permission.MEMBER_UPDATE)
  @Get('all')
  @ApiOperation({ summary: 'Tüm meslek/unvanları listele', description: 'Aktif ve pasif tüm meslek/unvanları listeler' })
  @ApiResponse({ status: 200, description: 'Tüm meslek/unvan listesi' })
  async listAllProfessions() {
    return this.professionsService.listAllProfessions();
  }

  @Permissions(Permission.MEMBER_UPDATE)
  @Get(':id')
  @ApiOperation({ summary: 'Meslek/Unvan detayını getir' })
  @ApiParam({ name: 'id', description: 'Meslek/Unvan ID' })
  @ApiResponse({ status: 200, description: 'Meslek/Unvan detayı' })
  @ApiResponse({ status: 404, description: 'Meslek/Unvan bulunamadı' })
  async getProfessionById(@Param('id') id: string) {
    return this.professionsService.getProfessionById(id);
  }

  @Permissions(Permission.MEMBER_UPDATE)
  @Post()
  @ApiOperation({ summary: 'Meslek/Unvan oluştur' })
  @ApiBody({ type: CreateProfessionDto })
  @ApiResponse({ status: 201, description: 'Meslek/Unvan oluşturuldu' })
  async createProfession(@Body() dto: CreateProfessionDto) {
    return this.professionsService.createProfession(dto);
  }

  @Permissions(Permission.MEMBER_UPDATE)
  @Patch(':id')
  @ApiOperation({ summary: 'Meslek/Unvan güncelle' })
  @ApiParam({ name: 'id', description: 'Meslek/Unvan ID' })
  @ApiBody({ type: UpdateProfessionDto })
  @ApiResponse({ status: 200, description: 'Meslek/Unvan güncellendi' })
  @ApiResponse({ status: 404, description: 'Meslek/Unvan bulunamadı' })
  async updateProfession(
    @Param('id') id: string,
    @Body() dto: UpdateProfessionDto,
  ) {
    return this.professionsService.updateProfession(id, dto);
  }

  @Permissions(Permission.MEMBER_UPDATE)
  @Delete(':id')
  @ApiOperation({ summary: 'Meslek/Unvan sil', description: 'Kullanımda ise pasif yapar, değilse kalıcı olarak siler' })
  @ApiParam({ name: 'id', description: 'Meslek/Unvan ID' })
  @ApiResponse({ status: 200, description: 'Meslek/Unvan silindi veya pasif yapıldı' })
  @ApiResponse({ status: 404, description: 'Meslek/Unvan bulunamadı' })
  async deleteProfession(@Param('id') id: string) {
    return this.professionsService.deleteProfession(id);
  }
}

