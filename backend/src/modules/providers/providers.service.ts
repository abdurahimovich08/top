import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OnboardProviderDto } from './dto/onboard-provider.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';
import { KycStatus, Prisma } from '@prisma/client';

@Injectable()
export class ProvidersService {
  constructor(private readonly prisma: PrismaService) {}

  async getByUserId(userId: string) {
    return this.prisma.provider.findUnique({
      where: { userId },
      include: {
        categories: { include: { category: true } },
        services: true,
      },
    });
  }

  async onboard(userId: string, dto: OnboardProviderDto) {
    const categories = await this.prisma.category.findMany({
      where: { id: { in: dto.categoryIds } },
    });
    if (categories.length !== dto.categoryIds.length) {
      throw new BadRequestException('One or more categories are invalid');
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.provider.findUnique({ where: { userId } });
      const provider = existing
        ? await tx.provider.update({
            where: { userId },
            data: {
              businessName: dto.businessName,
              bio: dto.bio,
              headline: dto.headline,
            },
          })
        : await tx.provider.create({
            data: {
              userId,
              businessName: dto.businessName,
              bio: dto.bio,
              headline: dto.headline,
            },
          });

      await tx.providerCategory.deleteMany({ where: { providerId: provider.id } });
      if (dto.categoryIds.length) {
        await tx.providerCategory.createMany({
          data: dto.categoryIds.map((categoryId) => ({ providerId: provider.id, categoryId })),
        });
      }

      return provider;
    });
  }

  async updateProfile(userId: string, dto: UpdateProviderProfileDto) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }
    return this.prisma.provider.update({
      where: { userId },
      data: {
        businessName: dto.businessName ?? provider.businessName,
        bio: dto.bio ?? provider.bio,
        headline: dto.headline ?? provider.headline,
      },
    });
  }

  async submitKyc(userId: string, dto: SubmitKycDto) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }
    const kycData: Prisma.JsonObject = {
      documentType: dto.documentType,
      documentNumber: dto.documentNumber,
      documentUrl: dto.documentUrl,
    };
    return this.prisma.provider.update({
      where: { userId },
      data: {
        kycStatus: KycStatus.PENDING,
        kycSubmittedAt: new Date(),
        kycData,
      },
    });
  }

  async getDashboard(userId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) {
      throw new NotFoundException('Provider profile not found');
    }

    const [servicesCount, activeBookings] = await Promise.all([
      this.prisma.service.count({ where: { providerId: provider.id } }),
      this.prisma.booking.count({ where: { providerId: provider.id, status: { in: ['PENDING', 'CONFIRMED'] } } }),
    ]);

    return {
      providerId: provider.id,
      kycStatus: provider.kycStatus,
      servicesCount,
      activeBookings,
      pendingKyc: provider.kycStatus === KycStatus.PENDING,
    };
  }
}
