import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('providers')
  listProviders() {
    return { data: this.adminService.listProviders() };
  }

  @Post('providers/:providerId/verify')
  verifyProvider(@Param('providerId') providerId: string) {
    return { data: this.adminService.verifyProvider(providerId) };
  }

  @Patch('services/:serviceId/visibility')
  updateServiceVisibility(@Param('serviceId') serviceId: string, @Query('hidden') hidden = 'true') {
    return { data: this.adminService.hideService(serviceId, hidden !== 'false') };
  }

  @Get('disputes')
  listDisputes() {
    return { data: this.adminService.listDisputes() };
  }

  @Post('disputes/:disputeId/resolve')
  resolveDispute(@Param('disputeId') disputeId: string, @Body() dto: ResolveDisputeDto) {
    return { data: this.adminService.resolveDispute(disputeId, dto) };
  }
}
