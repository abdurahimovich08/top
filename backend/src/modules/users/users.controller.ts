import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserPresenter } from './presenters/user.presenter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface JwtPayload {
  sub: string;
  role: string;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload) {
    const userRecord = await this.usersService.findById(user.sub, true);
    if (!userRecord) {
      throw new NotFoundException();
    }
    return { data: UserPresenter.toHttp(userRecord) };
  }

  @Patch('me')
  async updateProfile(@CurrentUser() user: JwtPayload, @Body() dto: UpdateProfileDto) {
    const updated = await this.usersService.updateProfile(user.sub, dto);
    return { data: UserPresenter.toHttp(updated) };
  }

  @Get('me/addresses')
  async listAddresses(@CurrentUser() user: JwtPayload) {
    const addresses = await this.usersService.listAddresses(user.sub);
    return { data: addresses };
  }

  @Post('me/addresses')
  async createAddress(@CurrentUser() user: JwtPayload, @Body() dto: CreateAddressDto) {
    const address = await this.usersService.createAddress(user.sub, dto);
    return { data: address };
  }

  @Patch('me/addresses/:addressId')
  async updateAddress(
    @CurrentUser() user: JwtPayload,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    const address = await this.usersService.updateAddress(user.sub, addressId, dto);
    return { data: address };
  }

  @Delete('me/addresses/:addressId')
  async deleteAddress(@CurrentUser() user: JwtPayload, @Param('addressId') addressId: string) {
    return this.usersService.removeAddress(user.sub, addressId);
  }
}
