import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { RoleResponseDto } from './dto/role-response.dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';

@ApiTags('Roles')
@ApiBearerAuth('JWT-auth')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions(Permission.ROLE_LIST, Permission.MEMBER_LIST_BY_PROVINCE)
  @ApiOperation({
    summary: 'Tüm rolleri listele',
    description: 'Sistem rolleri ve custom rolleri birlikte listeler',
  })
  @ApiResponse({
    status: 200,
    description: 'Rol listesi',
    type: [RoleResponseDto],
  })
  async listRoles() {
    return this.rolesService.listRoles();
  }

  @Get(':id')
  @Permissions(Permission.ROLE_VIEW)
  @ApiOperation({
    summary: 'Rol detayını getir',
    description: 'ID ile rol bilgilerini ve izinlerini getirir',
  })
  @ApiParam({ name: 'id', description: 'Rol ID', example: 'role-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Rol bilgileri',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Rol bulunamadı' })
  async getRoleById(@Param('id') id: string) {
    return this.rolesService.getRoleById(id);
  }

  @Post()
  @Permissions(Permission.ROLE_CREATE)
  @ApiOperation({
    summary: 'Yeni rol oluştur',
    description: 'Yeni bir custom rol ve izinlerini oluşturur',
  })
  @ApiResponse({
    status: 201,
    description: 'Rol başarıyla oluşturuldu',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Bu isimde bir rol zaten mevcut' })
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Put(':id')
  @Permissions(Permission.ROLE_UPDATE)
  @ApiOperation({
    summary: 'Rol bilgilerini güncelle',
    description: 'Rol adı, açıklaması ve aktiflik durumunu günceller',
  })
  @ApiParam({ name: 'id', description: 'Rol ID', example: 'role-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Rol başarıyla güncellendi',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Rol bulunamadı' })
  @ApiResponse({ status: 409, description: 'Bu isimde bir rol zaten mevcut' })
  async updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updateRole(id, dto);
  }

  @Delete(':id')
  @Permissions(Permission.ROLE_DELETE)
  @ApiOperation({
    summary: 'Rolü sil',
    description: 'Rolü soft delete yapar. Kullanıcılara atanmışsa silinemez.',
  })
  @ApiParam({ name: 'id', description: 'Rol ID', example: 'role-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Rol başarıyla silindi',
  })
  @ApiResponse({ status: 404, description: 'Rol bulunamadı' })
  @ApiResponse({
    status: 400,
    description: 'Rol kullanıcılara atanmış, silinemez',
  })
  async deleteRole(@Param('id') id: string) {
    await this.rolesService.deleteRole(id);
    return { message: 'Rol başarıyla silindi' };
  }

  @Put(':id/permissions')
  @Permissions(Permission.ROLE_MANAGE_PERMISSIONS)
  @ApiOperation({
    summary: 'Rol izinlerini güncelle',
    description: 'Rolün izinlerini tamamen değiştirir',
  })
  @ApiParam({ name: 'id', description: 'Rol ID', example: 'role-uuid-123' })
  @ApiResponse({
    status: 200,
    description: 'Rol izinleri başarıyla güncellendi',
    type: RoleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Rol bulunamadı' })
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.rolesService.updateRolePermissions(id, dto);
  }
}

