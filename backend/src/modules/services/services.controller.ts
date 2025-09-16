import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { SearchServicesDto } from './dto/search-services.dto';
import { ServicePresenter } from './presenters/service.presenter';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CreateMediaDto } from './dto/create-media.dto';
import { PublishServiceDto } from './dto/publish-service.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

interface JwtPayload {
  sub: string;
}

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async search(@Query() query: SearchServicesDto) {
    const result = await this.servicesService.search(query);
    return {
      data: result.data.map((service) => ServicePresenter.toListItem(service)),
      meta: result.meta,
    };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const service = await this.servicesService.findById(id);
    return { data: ServicePresenter.toDetail(service as any) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Get('provider/mine')
  async listMine(@CurrentUser() user: JwtPayload) {
    const services = await this.servicesService.listProviderServices(user.sub);
    return { data: services.map((service) => ServicePresenter.toListItem(service)) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateServiceDto) {
    const service = await this.servicesService.createService(user.sub, dto);
    return { data: ServicePresenter.toListItem(service) };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Patch(':id')
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    const service = await this.servicesService.updateService(user.sub, id, dto);
    return { data: service };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Patch(':id/publish')
  async publish(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: PublishServiceDto,
  ) {
    const service = await this.servicesService.publishService(user.sub, id, dto.isPublished);
    return { data: service };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Post(':id/packages')
  async createPackage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreatePackageDto,
  ) {
    const pkg = await this.servicesService.createPackage(user.sub, id, dto);
    return { data: pkg };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Patch(':serviceId/packages/:packageId')
  async updatePackage(
    @CurrentUser() user: JwtPayload,
    @Param('serviceId') serviceId: string,
    @Param('packageId') packageId: string,
    @Body() dto: UpdatePackageDto,
  ) {
    const pkg = await this.servicesService.updatePackage(user.sub, serviceId, packageId, dto);
    return { data: pkg };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Delete(':serviceId/packages/:packageId')
  async removePackage(
    @CurrentUser() user: JwtPayload,
    @Param('serviceId') serviceId: string,
    @Param('packageId') packageId: string,
  ) {
    return this.servicesService.removePackage(user.sub, serviceId, packageId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Post(':id/media')
  async addMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateMediaDto,
  ) {
    const media = await this.servicesService.addMedia(user.sub, id, dto);
    return { data: media };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROVIDER)
  @Delete(':serviceId/media/:mediaId')
  async removeMedia(
    @CurrentUser() user: JwtPayload,
    @Param('serviceId') serviceId: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.servicesService.removeMedia(user.sub, serviceId, mediaId);
  }
}
