import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
} from '@nestjs/common';
import { RegionsService } from './regions.service';
import {
  CreateProvinceDto,
  CreateDistrictDto,
  CreateWorkplaceDto,
  CreateDealerDto,
  AssignUserScopeDto,
} from './dto';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permission.enum';

@Controller('regions')
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  // -------- PROVINCE --------

  @Permissions(Permission.REGION_LIST)
  @Get('provinces')
  async getProvinces() {
    return this.regionsService.listProvinces();
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Post('provinces')
  async createProvince(@Body() dto: CreateProvinceDto) {
    return this.regionsService.createProvince(dto);
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Put('provinces/:id')
  async updateProvince(
    @Param('id') id: string,
    @Body() dto: CreateProvinceDto,
  ) {
    return this.regionsService.updateProvince(id, dto);
  }

  // -------- DISTRICT --------

  @Permissions(Permission.REGION_LIST)
  @Get('districts')
  async getDistricts(@Query('provinceId') provinceId?: string) {
    return this.regionsService.listDistricts(provinceId);
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Post('districts')
  async createDistrict(@Body() dto: CreateDistrictDto) {
    return this.regionsService.createDistrict(dto);
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Put('districts/:id')
  async updateDistrict(
    @Param('id') id: string,
    @Body() dto: CreateDistrictDto,
  ) {
    return this.regionsService.updateDistrict(id, dto);
  }

  // -------- WORKPLACE --------

  @Permissions(Permission.WORKPLACE_LIST)
  @Get('workplaces')
  async getWorkplaces(
    @Query('provinceId') provinceId?: string,
    @Query('districtId') districtId?: string,
  ) {
    return this.regionsService.listWorkplaces(provinceId, districtId);
  }

  @Permissions(Permission.WORKPLACE_MANAGE)
  @Post('workplaces')
  async createWorkplace(@Body() dto: CreateWorkplaceDto) {
    return this.regionsService.createWorkplace(dto);
  }

  @Permissions(Permission.WORKPLACE_MANAGE)
  @Put('workplaces/:id')
  async updateWorkplace(
    @Param('id') id: string,
    @Body() dto: CreateWorkplaceDto,
  ) {
    return this.regionsService.updateWorkplace(id, dto);
  }

  // -------- DEALER --------

  @Permissions(Permission.DEALER_LIST)
  @Get('dealers')
  async getDealers(
    @Query('provinceId') provinceId?: string,
    @Query('districtId') districtId?: string,
  ) {
    return this.regionsService.listDealers(provinceId, districtId);
  }

  @Permissions(Permission.DEALER_CREATE)
  @Post('dealers')
  async createDealer(@Body() dto: CreateDealerDto) {
    return this.regionsService.createDealer(dto);
  }

  @Permissions(Permission.DEALER_UPDATE)
  @Put('dealers/:id')
  async updateDealer(
    @Param('id') id: string,
    @Body() dto: CreateDealerDto,
  ) {
    return this.regionsService.updateDealer(id, dto);
  }

  // -------- USER SCOPE --------

  // Kullanıcıya il / ilçe / işyeri / bayi scope atama
  @Permissions(Permission.BRANCH_MANAGE)
  @Post('user-scope')
  async assignUserScope(@Body() dto: AssignUserScopeDto) {
    return this.regionsService.assignUserScope(dto);
  }

  @Permissions(Permission.BRANCH_MANAGE)
  @Get('user-scope/:userId')
  async getUserScope(@Param('userId') userId: string) {
    return this.regionsService.getUserScope(userId);
  }
}
