import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { OnboardProviderDto } from './dto/onboard-provider.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ProviderPresenter } from './presenters/provider.presenter';

interface JwtPayload {
  sub: string;
}

@ApiTags('provider')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PROVIDER)
@Controller('provider')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post('onboard')
  async onboard(@CurrentUser() user: JwtPayload, @Body() dto: OnboardProviderDto) {
    await this.providersService.onboard(user.sub, dto);
    const provider = await this.providersService.getByUserId(user.sub);
    return { data: provider ? ProviderPresenter.toHttp(provider as any) : null };
  }

  @Get('me')
  async getProfile(@CurrentUser() user: JwtPayload) {
    const provider = await this.providersService.getByUserId(user.sub);
    return { data: provider ? ProviderPresenter.toHttp(provider as any) : null };
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProviderProfileDto,
  ) {
    await this.providersService.updateProfile(user.sub, dto);
    const provider = await this.providersService.getByUserId(user.sub);
    return { data: provider ? ProviderPresenter.toHttp(provider as any) : null };
  }

  @Post('kyc')
  async submitKyc(@CurrentUser() user: JwtPayload, @Body() dto: SubmitKycDto) {
    await this.providersService.submitKyc(user.sub, dto);
    const provider = await this.providersService.getByUserId(user.sub);
    return { data: provider ? ProviderPresenter.toHttp(provider as any) : null };
  }

  @Get('dashboard')
  async dashboard(@CurrentUser() user: JwtPayload) {
    const dashboard = await this.providersService.getDashboard(user.sub);
    return { data: dashboard };
  }
}
