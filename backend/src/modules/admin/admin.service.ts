import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { KycStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listProviders() {
    return this.prisma.provider.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true, services: true },
    });
  }

  async verifyProvider(providerId: string) {
    return this.prisma.provider.update({
      where: { id: providerId },
      data: { kycStatus: KycStatus.APPROVED, verifiedAt: new Date() },
    });
  }

  async hideService(serviceId: string, hidden: boolean) {
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { isPublished: !hidden },
    });
  }

  listDisputes() {
    return this.prisma.dispute.findMany({ orderBy: { createdAt: 'desc' }, include: { booking: true } });
  }

  async resolveDispute(disputeId: string, dto: ResolveDisputeDto) {
    const dispute = await this.prisma.dispute.findUnique({ where: { id: disputeId } });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    return this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: dto.status,
        resolution: dto.resolution,
        resolvedAt: new Date(),
      },
    });
  }
}
