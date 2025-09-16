import { Logger } from '@nestjs/common';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection {
  private readonly logger = new Logger(ChatGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(private readonly chatService: ChatService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string | undefined;
    if (!userId) {
      this.logger.warn('Client connected without userId');
      client.disconnect(true);
      return;
    }
    client.join(userId);
    this.logger.log(`Client ${userId} connected to chat`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const senderId = client.handshake.query.userId as string;
    const message = await this.chatService.sendMessage(senderId, payload);
    this.server.to(payload.recipientId).emit('message', message);
    this.server.to(senderId).emit('message', message);
    return message;
  }
}
