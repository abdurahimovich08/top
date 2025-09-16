import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewPresenter } from './presenters/review.presenter';

interface JwtPayload {
  sub: string;
}

@ApiTags('reviews')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  async create(@CurrentUser() user: JwtPayload, @Body() dto: CreateReviewDto) {
    const review = await this.reviewsService.createReview(user.sub, dto);
    return { data: ReviewPresenter.toHttp(review) };
  }

  @Get('me')
  async listMine(@CurrentUser() user: JwtPayload) {
    const reviews = await this.reviewsService.listMyReviews(user.sub);
    return { data: reviews.map((review) => ReviewPresenter.toHttp(review)) };
  }

  @Get('service/:serviceId')
  async listForService(@Param('serviceId') serviceId: string) {
    const reviews = await this.reviewsService.listServiceReviews(serviceId);
    return { data: reviews.map((review) => ReviewPresenter.toHttp(review)) };
  }
}
