import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BookingPresenter } from './presenters/booking.presenter';
import { BookingQueryDto } from './dto/booking-query.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { UserRole } from '@prisma/client';

interface JwtPayload {
  sub: string;
  role: UserRole;
}

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBookingDto) {
    const booking = await this.bookingsService.createBooking(user.sub, dto);
    return { data: BookingPresenter.toHttp(booking) };
  }

  @Get('me')
  async listMine(@CurrentUser() user: JwtPayload, @Query() query: BookingQueryDto) {
    const result = await this.bookingsService.listCustomerBookings(user.sub, query);
    return {
      data: result.data.map((booking) => BookingPresenter.toHttp(booking)),
      meta: result.meta,
    };
  }

  @Get('provider/mine')
  async listProvider(@CurrentUser() user: JwtPayload, @Query() query: BookingQueryDto) {
    const result = await this.bookingsService.listProviderBookings(user.sub, query);
    return {
      data: result.data.map((booking) => BookingPresenter.toHttp(booking)),
      meta: result.meta,
    };
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    const booking = await this.bookingsService.updateStatus(user.sub, user.role, id, dto);
    return { data: BookingPresenter.toHttp(booking) };
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CancelBookingDto,
  ) {
    const booking = await this.bookingsService.cancelBooking(user.sub, id, dto);
    return { data: BookingPresenter.toHttp(booking) };
  }
}
