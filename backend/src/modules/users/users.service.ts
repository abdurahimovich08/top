import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Prisma, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const data: Prisma.UserCreateInput = {
      phone: createUserDto.phone,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role: createUserDto.role ?? UserRole.CUSTOMER,
    };
    return this.prisma.user.create({ data });
  }

  findById(id: string, includeAddresses = false) {
    return this.prisma.user.findUnique({
      where: { id },
      include: includeAddresses ? { addresses: true } : undefined,
    });
  }

  findByPhone(phone: string) {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
        language: dto.language,
      },
      include: { addresses: true },
    });
  }

  async updateRole(userId: string, role: UserRole) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
      include: { addresses: true },
    });
  }

  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAddress(userId: string, dto: CreateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      if (dto.isPrimary) {
        await tx.address.updateMany({
          where: { userId },
          data: { isPrimary: false },
        });
      }

      return tx.address.create({
        data: {
          userId,
          label: dto.label,
          line1: dto.line1,
          line2: dto.line2,
          city: dto.city,
          state: dto.state,
          postalCode: dto.postalCode,
          country: dto.country,
          latitude: dto.latitude,
          longitude: dto.longitude,
          isPrimary: dto.isPrimary ?? false,
        },
      });
    });
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    return this.prisma.$transaction(async (tx) => {
      const address = await tx.address.findFirst({ where: { id: addressId, userId } });
      if (!address) {
        throw new NotFoundException('Address not found');
      }

      if (dto.isPrimary) {
        await tx.address.updateMany({
          where: { userId, NOT: { id: addressId } },
          data: { isPrimary: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: {
          ...dto,
        },
      });
    });
  }

  async removeAddress(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.prisma.address.delete({ where: { id: addressId } });
    return { deleted: true };
  }
}
