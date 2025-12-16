import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RegionsService } from './regions.service';
import {
  CreateProvinceDto,
  CreateDistrictDto,
  CreateWorkplaceDto,
  CreateDealerDto,
  AssignUserScopeDto,
  CreateBranchDto,
  UpdateBranchDto,
  AssignBranchPresidentDto,
} from './dto';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('Regions')
@ApiBearerAuth('JWT-auth')
@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  // -------- PROVINCE --------

  @Permissions(Permission.REGION_LIST, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get('provinces')
  @ApiOperation({ summary: 'İlleri listele', description: 'Tüm illeri listeler' })
  @ApiResponse({ status: 200, description: 'İl listesi', type: 'array' })
  async getProvinces() {
    return this.regionsService.listProvinces();
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Post('provinces')
  @ApiOperation({ summary: 'Yeni il oluştur', description: 'Yeni bir il kaydı oluşturur' })
  @ApiBody({ type: CreateProvinceDto })
  @ApiResponse({ status: 201, description: 'İl başarıyla oluşturuldu' })
  async createProvince(@Body() dto: CreateProvinceDto) {
    return this.regionsService.createProvince(dto);
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Put('provinces/:id')
  @ApiOperation({ summary: 'İl bilgilerini güncelle', description: 'Mevcut il bilgilerini günceller' })
  @ApiParam({ name: 'id', description: 'İl ID', example: 'province-uuid-123' })
  @ApiBody({ type: CreateProvinceDto })
  @ApiResponse({ status: 200, description: 'İl başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'İl bulunamadı' })
  async updateProvince(
    @Param('id') id: string,
    @Body() dto: CreateProvinceDto,
  ) {
    return this.regionsService.updateProvince(id, dto);
  }

  // -------- DISTRICT --------

  @Permissions(Permission.REGION_LIST, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get('districts')
  @ApiOperation({ summary: 'İlçeleri listele', description: 'Tüm ilçeleri veya belirli bir ile bağlı ilçeleri listeler' })
  @ApiQuery({ name: 'provinceId', required: false, description: 'İl ID (filtreleme için)', example: 'province-uuid-123' })
  @ApiResponse({ status: 200, description: 'İlçe listesi', type: 'array' })
  async getDistricts(@Query('provinceId') provinceId?: string) {
    return this.regionsService.listDistricts(provinceId);
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Post('districts')
  @ApiOperation({ summary: 'Yeni ilçe oluştur', description: 'Yeni bir ilçe kaydı oluşturur' })
  @ApiBody({ type: CreateDistrictDto })
  @ApiResponse({ status: 201, description: 'İlçe başarıyla oluşturuldu' })
  async createDistrict(@Body() dto: CreateDistrictDto) {
    return this.regionsService.createDistrict(dto);
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Put('districts/:id')
  @ApiOperation({ summary: 'İlçe bilgilerini güncelle', description: 'Mevcut ilçe bilgilerini günceller' })
  @ApiParam({ name: 'id', description: 'İlçe ID', example: 'district-uuid-456' })
  @ApiBody({ type: CreateDistrictDto })
  @ApiResponse({ status: 200, description: 'İlçe başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'İlçe bulunamadı' })
  async updateDistrict(
    @Param('id') id: string,
    @Body() dto: CreateDistrictDto,
  ) {
    return this.regionsService.updateDistrict(id, dto);
  }

  // -------- WORKPLACE --------

  @Permissions(Permission.WORKPLACE_LIST)
  @Get('workplaces')
  @ApiOperation({ summary: 'İş yerlerini listele', description: 'Tüm iş yerlerini veya filtrelenmiş listeyi getirir' })
  @ApiQuery({ name: 'provinceId', required: false, description: 'İl ID (filtreleme için)', example: 'province-uuid-123' })
  @ApiQuery({ name: 'districtId', required: false, description: 'İlçe ID (filtreleme için)', example: 'district-uuid-456' })
  @ApiResponse({ status: 200, description: 'İş yeri listesi', type: 'array' })
  async getWorkplaces(
    @Query('provinceId') provinceId?: string,
    @Query('districtId') districtId?: string,
  ) {
    return this.regionsService.listWorkplaces(provinceId, districtId);
  }

  @Permissions(Permission.WORKPLACE_MANAGE)
  @Post('workplaces')
  @ApiOperation({ summary: 'Yeni iş yeri oluştur', description: 'Yeni bir iş yeri kaydı oluşturur' })
  @ApiBody({ type: CreateWorkplaceDto })
  @ApiResponse({ status: 201, description: 'İş yeri başarıyla oluşturuldu' })
  async createWorkplace(@Body() dto: CreateWorkplaceDto) {
    return this.regionsService.createWorkplace(dto);
  }

  @Permissions(Permission.WORKPLACE_MANAGE)
  @Put('workplaces/:id')
  @ApiOperation({ summary: 'İş yeri bilgilerini güncelle', description: 'Mevcut iş yeri bilgilerini günceller' })
  @ApiParam({ name: 'id', description: 'İş yeri ID', example: 'workplace-uuid-789' })
  @ApiBody({ type: CreateWorkplaceDto })
  @ApiResponse({ status: 200, description: 'İş yeri başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'İş yeri bulunamadı' })
  async updateWorkplace(
    @Param('id') id: string,
    @Body() dto: CreateWorkplaceDto,
  ) {
    return this.regionsService.updateWorkplace(id, dto);
  }

  // -------- DEALER --------

  @Permissions(Permission.DEALER_LIST)
  @Get('dealers')
  @ApiOperation({ summary: 'Bayileri listele', description: 'Tüm bayileri veya filtrelenmiş listeyi getirir' })
  @ApiQuery({ name: 'provinceId', required: false, description: 'İl ID (filtreleme için)', example: 'province-uuid-123' })
  @ApiQuery({ name: 'districtId', required: false, description: 'İlçe ID (filtreleme için)', example: 'district-uuid-456' })
  @ApiResponse({ status: 200, description: 'Bayi listesi', type: 'array' })
  async getDealers(
    @Query('provinceId') provinceId?: string,
    @Query('districtId') districtId?: string,
  ) {
    return this.regionsService.listDealers(provinceId, districtId);
  }

  @Permissions(Permission.DEALER_CREATE)
  @Post('dealers')
  @ApiOperation({ summary: 'Yeni bayi oluştur', description: 'Yeni bir bayi kaydı oluşturur' })
  @ApiBody({ type: CreateDealerDto })
  @ApiResponse({ status: 201, description: 'Bayi başarıyla oluşturuldu' })
  async createDealer(@Body() dto: CreateDealerDto) {
    return this.regionsService.createDealer(dto);
  }

  @Permissions(Permission.DEALER_UPDATE)
  @Put('dealers/:id')
  @ApiOperation({ summary: 'Bayi bilgilerini güncelle', description: 'Mevcut bayi bilgilerini günceller' })
  @ApiParam({ name: 'id', description: 'Bayi ID', example: 'dealer-uuid-012' })
  @ApiBody({ type: CreateDealerDto })
  @ApiResponse({ status: 200, description: 'Bayi başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Bayi bulunamadı' })
  async updateDealer(
    @Param('id') id: string,
    @Body() dto: CreateDealerDto,
  ) {
    return this.regionsService.updateDealer(id, dto);
  }

  // -------- USER SCOPE --------

  @Permissions(Permission.BRANCH_MANAGE)
  @Post('user-scope')
  @ApiOperation({ summary: 'Kullanıcıya scope ata', description: 'Kullanıcıya il/ilçe/işyeri/bayi yetkisi atar' })
  @ApiBody({ type: AssignUserScopeDto })
  @ApiResponse({ status: 201, description: 'Scope başarıyla atandı' })
  async assignUserScope(@Body() dto: AssignUserScopeDto) {
    return this.regionsService.assignUserScope(dto);
  }

  @Permissions(Permission.BRANCH_MANAGE, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get('user-scope/:userId')
  @ApiOperation({ summary: 'Kullanıcı scope bilgilerini getir', description: 'Kullanıcının atanmış scope bilgilerini getirir' })
  @ApiParam({ name: 'userId', description: 'Kullanıcı ID', example: 'user-uuid-123' })
  @ApiResponse({ status: 200, description: 'Kullanıcı scope bilgileri' })
  @ApiResponse({ status: 404, description: 'Kullanıcı veya scope bulunamadı' })
  @ApiResponse({ status: 403, description: 'Bu kullanıcının scope bilgilerini görme yetkiniz yok' })
  async getUserScope(
    @Param('userId') userId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    // MEMBER_LIST_BY_PROVINCE izni olan kullanıcılar sadece kendi scope'larını görebilir
    const hasMemberListByProvince = user.permissions?.includes(Permission.MEMBER_LIST_BY_PROVINCE);
    const hasBranchManage = user.permissions?.includes(Permission.BRANCH_MANAGE);
    
    if (hasMemberListByProvince && !hasBranchManage) {
      // Sadece MEMBER_LIST_BY_PROVINCE izni varsa, sadece kendi scope'unu görebilir
      if (userId !== user.userId) {
        throw new ForbiddenException('Bu kullanıcının scope bilgilerini görme yetkiniz yok');
      }
    }
    
    return this.regionsService.getUserScope(userId);
  }

  // -------- BRANCH --------

  @Permissions(Permission.BRANCH_MANAGE, Permission.MEMBER_LIST_BY_PROVINCE)
  @Get('branches')
  @ApiOperation({ summary: 'Şubeleri listele', description: 'Tüm şubeleri veya filtrelenmiş listeyi getirir' })
  @ApiQuery({ name: 'provinceId', required: false, description: 'İl ID (filtreleme için)', example: 'province-uuid-123' })
  @ApiQuery({ name: 'districtId', required: false, description: 'İlçe ID (filtreleme için)', example: 'district-uuid-456' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Aktif mi?', example: true, type: Boolean })
  @ApiResponse({ status: 200, description: 'Şube listesi', type: 'array' })
  async getBranches(
    @Query('provinceId') provinceId?: string,
    @Query('districtId') districtId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: { provinceId?: string; districtId?: string; isActive?: boolean } = {};
    if (provinceId) filters.provinceId = provinceId;
    if (districtId) filters.districtId = districtId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';

    return this.regionsService.listBranches(filters);
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Get('branches/:id')
  @ApiOperation({ summary: 'Şube detayını getir', description: 'Belirtilen şubenin detaylarını getirir' })
  @ApiParam({ name: 'id', description: 'Şube ID', example: 'branch-uuid-123' })
  @ApiResponse({ status: 200, description: 'Şube detayı' })
  @ApiResponse({ status: 404, description: 'Şube bulunamadı' })
  async getBranchById(@Param('id') id: string) {
    return this.regionsService.getBranchById(id);
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Post('branches')
  @ApiOperation({ summary: 'Yeni şube oluştur', description: 'Yeni bir şube kaydı oluşturur' })
  @ApiBody({ type: CreateBranchDto })
  @ApiResponse({ status: 201, description: 'Şube başarıyla oluşturuldu' })
  async createBranch(@Body() dto: CreateBranchDto) {
    return this.regionsService.createBranch(dto);
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Put('branches/:id')
  @ApiOperation({ summary: 'Şube bilgilerini güncelle', description: 'Mevcut şube bilgilerini günceller' })
  @ApiParam({ name: 'id', description: 'Şube ID', example: 'branch-uuid-123' })
  @ApiBody({ type: UpdateBranchDto })
  @ApiResponse({ status: 200, description: 'Şube başarıyla güncellendi' })
  @ApiResponse({ status: 404, description: 'Şube bulunamadı' })
  async updateBranch(
    @Param('id') id: string,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.regionsService.updateBranch(id, dto);
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Delete('branches/:id')
  @ApiOperation({ summary: 'Şube sil', description: 'Mevcut şubeyi siler' })
  @ApiParam({ name: 'id', description: 'Şube ID', example: 'branch-uuid-123' })
  @ApiResponse({ status: 200, description: 'Şube başarıyla silindi' })
  @ApiResponse({ status: 404, description: 'Şube bulunamadı' })
  async deleteBranch(@Param('id') id: string) {
    await this.regionsService.deleteBranch(id);
    return { message: 'Şube başarıyla silindi' };
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Post('branches/:id/assign-president')
  @ApiOperation({ summary: 'Şube başkanı ata', description: 'Şubeye başkan kullanıcı atar' })
  @ApiParam({ name: 'id', description: 'Şube ID', example: 'branch-uuid-123' })
  @ApiBody({ type: AssignBranchPresidentDto })
  @ApiResponse({ status: 200, description: 'Başkan başarıyla atandı' })
  @ApiResponse({ status: 404, description: 'Şube veya kullanıcı bulunamadı' })
  async assignBranchPresident(
    @Param('id') id: string,
    @Body() dto: AssignBranchPresidentDto,
  ) {
    return this.regionsService.assignBranchPresident(id, dto);
  }
}
