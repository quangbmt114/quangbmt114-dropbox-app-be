import {
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoggerService, LogContext } from '../../common/logger/logger.service';
import { SUCCESS_MESSAGES, SYSTEM } from '../../common/constants';
import { BusinessException } from '../../common/exceptions';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, name } = registerDto;

    this.logger.logAuth('User registration attempt', undefined, { email });

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn('Registration failed: Email already exists', { 
        context: LogContext.AUTH,
        email,
        errorCode: 'AUTH_EMAIL_EXISTS'
      });
      throw BusinessException.emailExists(email);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    this.logger.logAuth(SUCCESS_MESSAGES.USER_REGISTERED, user.id, { email });

    // Generate JWT token
    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    this.logger.logAuth('User login attempt', undefined, { email });

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      this.logger.warn('Login failed: User not found', {
        context: LogContext.AUTH,
        email,
        errorCode: 'AUTH_INVALID_CREDENTIALS'
      });
      throw BusinessException.invalidCredentials();
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn('Login failed: Invalid password', {
        context: LogContext.AUTH,
        email,
        userId: user.id,
        errorCode: 'AUTH_INVALID_CREDENTIALS'
      });
      throw BusinessException.invalidCredentials();
    }

    this.logger.logAuth(SUCCESS_MESSAGES.USER_LOGGED_IN, user.id, { email });

    // Generate JWT token
    const accessToken = this.generateToken(user.id, user.email);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    };
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SYSTEM.BCRYPT_ROUNDS);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Generate JWT access token
   */
  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email };
    return this.jwtService.sign(payload);
  }
}

