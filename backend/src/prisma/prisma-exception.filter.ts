import { ArgumentsHost, Catch, ConflictException, ExceptionFilter, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    switch (exception.code) {
      case 'P2002':
        response
          .status(409)
          .json(new ConflictException({ message: 'Unique constraint violation', meta: exception.meta }));
        break;
      case 'P2025':
        response.status(404).json(new NotFoundException(exception.meta));
        break;
      default:
        response.status(500).json({ message: exception.message, meta: exception.meta });
    }
  }
}
