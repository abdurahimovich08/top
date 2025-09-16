import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserPresenter } from '../users/presenters/user.presenter';
import { UserRole } from '@prisma/client';

interface OtpEntry {
  code: string;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly otpStore = new Map<string, OtpEntry>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async requestOtp({ phone }: RequestOtpDto) {
    const ttl = this.configService.get<number>('app.otp.ttl') ?? 300;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + ttl * 1000;
    this.otpStore.set(phone, { code, expiresAt });
    this.logger.debug(`Generated OTP ${code} for phone ${phone}`);

    return {
      message: 'OTP generated successfully',
      expiresIn: ttl,
      otp: this.configService.get<string>('app.env') !== 'production' ? code : undefined,
    };
  }

  async verifyOtp({ phone, code, role }: VerifyOtpDto) {
    const entry = this.otpStore.get(phone);
    if (!entry || entry.code !== code || entry.expiresAt < Date.now()) {
      throw new UnauthorizedException('Invalid or expired OTP code');
    }
    this.otpStore.delete(phone);

    let user = await this.usersService.findByPhone(phone);
    if (!user) {
      const created = await this.usersService.create({ phone, role: role ?? UserRole.CUSTOMER });
      user = await this.usersService.findById(created.id, true);
    } else if (role && user.role !== role) {
      user = await this.usersService.updateRole(user.id, role);
    } else {
      user = await this.usersService.findById(user.id, true);
    }

    if (!user) {
      throw new UnauthorizedException('User record missing');
    }

    const payload: JwtPayload = {
      sub: user.id,
      phone: user.phone,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: this.configService.get<string>('app.jwt.expiresIn'),
    });

    return {
      tokenType: 'Bearer',
      accessToken,
      expiresIn: this.configService.get<string>('app.jwt.expiresIn'),
      user: UserPresenter.toHttp(user),
    };
  }
}
