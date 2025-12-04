import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Delete,
} from '@nestjs/common';
import { MembersService } from './members.service';
import { CreateMemberApplicationDto } from './dto/create-member-application.dto';
import { Permissions } from '../auth/permissions.decorator';
import { Permission } from '../auth/permission.enum';
import { CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserData } from '../auth/current-user.decorator';

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Permissions(Permission.MEMBER_CREATE_APPLICATION)
  @Post('applications')
  async createApplication(
    @Body() dto: CreateMemberApplicationDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    const member = await this.membersService.createApplication(
      dto,
      user.userId,
    );
    return member;
  }

  // Scope + PENDING
  @Permissions(Permission.MEMBER_LIST, Permission.MEMBER_APPROVE)
  @Get('applications')
  async listApplications(@CurrentUser() user: CurrentUserData) {
    return this.membersService.listApplicationsForUser(user);
  }

  // Scope + aktif üyeler
  @Permissions(Permission.MEMBER_LIST)
  @Get()
  async listMembers(@CurrentUser() user: CurrentUserData) {
    return this.membersService.listMembersForUser(user);
  }

  @Permissions(Permission.MEMBER_VIEW)
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.membersService.getById(id);
  }

  @Permissions(Permission.MEMBER_APPROVE)
  @Post(':id/approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.membersService.approve(id, user.userId);
  }

  @Permissions(Permission.MEMBER_REJECT)
  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.membersService.reject(id, user.userId);
  }

  @Permissions(Permission.MEMBER_STATUS_CHANGE)
  @Delete(':id')
  async softDelete(@Param('id') id: string) {
    return this.membersService.softDelete(id);
  }
}
