import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { CreateMediaDto } from './dto/create-media.dto';
import { SearchServicesDto } from './dto/search-services.dto';
import { Prisma, MediaType } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getProviderOrThrow(userId: string) {
    const provider = await this.prisma.provider.findUnique({ where: { userId } });
    if (!provider) {
      throw new ForbiddenException('Provider profile required');
    }
    return provider;
  }

  private async ensureServiceOwnership(userId: string, serviceId: string) {
    const provider = await this.getProviderOrThrow(userId);
    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service || service.providerId !== provider.id) {
      throw new ForbiddenException('You do not have access to this service');
    }
    return { provider, service };
  }

  async search(dto: SearchServicesDto) {
    const { page = 1, limit = 20 } = dto;
    const where: Prisma.ServiceWhereInput = {};

    if (dto.publishedOnly !== false) {
      where.isPublished = true;
    }
    if (dto.categoryId) {
      where.categoryId = dto.categoryId;
    }
    if (dto.providerId) {
      where.providerId = dto.providerId;
    }
    if (dto.q) {
      const query = dto.q.trim();
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query.toLowerCase()] } },
      ];
    }
    if (dto.minPrice !== undefined || dto.maxPrice !== undefined) {
      where.priceFrom = {};
      if (dto.minPrice !== undefined) {
        where.priceFrom.gte = new Prisma.Decimal(dto.minPrice);
      }
      if (dto.maxPrice !== undefined) {
        where.priceFrom.lte = new Prisma.Decimal(dto.maxPrice);
      }
    }
    if (dto.lat !== undefined && dto.lng !== undefined && dto.radiusKm) {
      const latDelta = dto.radiusKm / 110.574;
      const lngDelta = dto.radiusKm / (111.32 * Math.cos((dto.lat * Math.PI) / 180));
      where.latitude = { gte: dto.lat - latDelta, lte: dto.lat + latDelta };
      where.longitude = { gte: dto.lng - lngDelta, lte: dto.lng + lngDelta };
    }

    let orderBy: Prisma.ServiceOrderByWithRelationInput = { createdAt: 'desc' };
    switch (dto.sort) {
      case 'PRICE_ASC':
        orderBy = { priceFrom: 'asc' };
        break;
      case 'PRICE_DESC':
        orderBy = { priceFrom: 'desc' };
        break;
      case 'RATING':
        orderBy = { averageRating: 'desc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        where,
        orderBy,
        take: limit,
        skip: (page - 1) * limit,
        include: {
          provider: true,
          packages: { where: { isActive: true } },
          media: true,
        },
      }),
      this.prisma.service.count({ where }),
    ]);

    return { data: items, meta: { total, page, limit } };
  }

  async findById(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        provider: { include: { user: true } },
        packages: { where: { isActive: true }, orderBy: { price: 'asc' } },
        media: true,
        reviews: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { customer: true },
        },
      },
    });
    if (!service) {
      throw new NotFoundException('Service not found');
    }
    return service;
  }

  async createService(userId: string, dto: CreateServiceDto) {
    const provider = await this.getProviderOrThrow(userId);
    return this.prisma.service.create({
      data: {
        providerId: provider.id,
        ownerId: userId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        priceFrom: dto.priceFrom !== undefined ? new Prisma.Decimal(dto.priceFrom) : undefined,
        currency: dto.currency ?? 'USD',
        addressId: dto.addressId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        tags: dto.tags?.map((tag) => tag.toLowerCase()),
      },
      include: {
        packages: true,
        media: true,
      },
    });
  }

  async updateService(userId: string, serviceId: string, dto: UpdateServiceDto) {
    await this.ensureServiceOwnership(userId, serviceId);
    return this.prisma.service.update({
      where: { id: serviceId },
      data: {
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description,
        coverImageUrl: dto.coverImageUrl,
        priceFrom: dto.priceFrom !== undefined ? new Prisma.Decimal(dto.priceFrom) : undefined,
        currency: dto.currency,
        addressId: dto.addressId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        tags: dto.tags?.map((tag) => tag.toLowerCase()),
      },
    });
  }

  async publishService(userId: string, serviceId: string, isPublished: boolean) {
    await this.ensureServiceOwnership(userId, serviceId);
    return this.prisma.service.update({
      where: { id: serviceId },
      data: { isPublished },
    });
  }

  async listProviderServices(userId: string) {
    const provider = await this.getProviderOrThrow(userId);
    return this.prisma.service.findMany({
      where: { providerId: provider.id },
      orderBy: { createdAt: 'desc' },
      include: { packages: true, media: true },
    });
  }

  async createPackage(userId: string, serviceId: string, dto: CreatePackageDto) {
    await this.ensureServiceOwnership(userId, serviceId);
    return this.prisma.servicePackage.create({
      data: {
        serviceId,
        name: dto.name,
        description: dto.description,
        price: new Prisma.Decimal(dto.price),
        currency: dto.currency ?? 'USD',
        durationMinutes: dto.durationMinutes,
      },
    });
  }

  async updatePackage(userId: string, serviceId: string, packageId: string, dto: UpdatePackageDto) {
    await this.ensureServiceOwnership(userId, serviceId);
    const pkg = await this.prisma.servicePackage.findUnique({ where: { id: packageId } });
    if (!pkg || pkg.serviceId !== serviceId) {
      throw new NotFoundException('Package not found');
    }

    return this.prisma.servicePackage.update({
      where: { id: packageId },
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price !== undefined ? new Prisma.Decimal(dto.price) : undefined,
        currency: dto.currency,
        durationMinutes: dto.durationMinutes,
        isActive: dto.isActive,
      },
    });
  }

  async removePackage(userId: string, serviceId: string, packageId: string) {
    await this.ensureServiceOwnership(userId, serviceId);
    const pkg = await this.prisma.servicePackage.findUnique({ where: { id: packageId } });
    if (!pkg || pkg.serviceId !== serviceId) {
      throw new NotFoundException('Package not found');
    }
    await this.prisma.servicePackage.delete({ where: { id: packageId } });
    return { deleted: true };
  }

  async addMedia(userId: string, serviceId: string, dto: CreateMediaDto) {
    await this.ensureServiceOwnership(userId, serviceId);
    if (dto.isPrimary) {
      await this.prisma.serviceMedia.updateMany({
        where: { serviceId },
        data: { isPrimary: false },
      });
    }
    return this.prisma.serviceMedia.create({
      data: {
        serviceId,
        url: dto.url,
        type: dto.type ? (dto.type as MediaType) : MediaType.IMAGE,
        isPrimary: dto.isPrimary ?? false,
      },
    });
  }

  async removeMedia(userId: string, serviceId: string, mediaId: string) {
    await this.ensureServiceOwnership(userId, serviceId);
    const media = await this.prisma.serviceMedia.findUnique({ where: { id: mediaId } });
    if (!media || media.serviceId !== serviceId) {
      throw new NotFoundException('Media item not found');
    }
    await this.prisma.serviceMedia.delete({ where: { id: mediaId } });
    return { deleted: true };
  }
}
