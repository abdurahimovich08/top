import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

interface JwtPayload {
  sub: string;
}

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':bookingId/messages')
  async listMessages(@CurrentUser() user: JwtPayload, @Param('bookingId') bookingId: string) {
    const messages = await this.chatService.listMessages(user.sub, bookingId);
    return { data: messages };
  }
}
