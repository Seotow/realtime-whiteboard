import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { CreateUserRequest, LoginRequest, AuthResponse, JwtPayload } from '@/types/auth';
import { logger } from '@/utils/logger';
import { db } from '@/services/database';
import { User } from '@prisma/client';

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  async register(userData: CreateUserRequest): Promise<AuthResponse> {
    try {
      const existingByEmail = await db.prisma.user.findUnique({
        where: { email: userData.email }
      });
      const existingByUsername = await db.prisma.user.findUnique({
        where: { username: userData.username }
      });
      if (existingByEmail || existingByUsername) {
        throw new Error('User with this email or username already exists');
      }
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      // Create new user
      const newUser = await db.prisma.user.create({
        data: {
          email: userData.email,
          username: userData.username,
          password: hashedPassword,
          isActive: true,
        }
      });
      // Generate tokens
      const token = this.generateAccessToken(newUser);
      const refreshToken = this.generateRefreshToken(newUser);
      // Store refresh token in database
      await db.prisma.session.create({        data: {
          userId: newUser.id,
          sessionToken: token,
          refreshToken: refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      });
      logger.info(`User registered: ${newUser.email}`);
      return {
        user: this.sanitizeUser(newUser),
        token,
        refreshToken,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      // Find user by email
      const user = await db.prisma.user.findUnique({
        where: { email: loginData.email }
      });
      if (!user) {
        throw new Error('Invalid email or password');
      }
      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }
      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }
      // Generate tokens
      const token = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);
      // Always create a new session (allow multiple sessions per user)
      await db.prisma.session.create({        data: {
          userId: user.id,
          sessionToken: token,
          refreshToken: refreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      });
      logger.info(`User logged in: ${user.email}`);
      return {
        user: this.sanitizeUser(user),
        token,
        refreshToken,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as JwtPayload;
      // Find session with refresh token
      const session = await db.prisma.session.findFirst({
        where: {
          refreshToken: refreshToken,
          expiresAt: { gt: new Date() },
        },
        include: { user: true }
      });
      if (!session || !session.user || !session.user.isActive) {
        throw new Error('Invalid refresh token');
      }
      const user = session.user;
      const newToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);
      // Update session with new tokens
      await db.prisma.session.update({
        where: { id: session.id },        data: {
          sessionToken: newToken,
          refreshToken: newRefreshToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          updatedAt: new Date(),
        }
      });
      return {
        user: this.sanitizeUser(user),
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const user = await db.prisma.user.findUnique({
        where: { id: userId }
      });
      return user;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const user = await db.prisma.user.findUnique({
        where: { email: email }
      });
      return user;
    } catch (error) {
      logger.error('Get user by email error:', error);
      return null;
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      // Remove all sessions for the user
      await db.prisma.session.deleteMany({
        where: { userId: userId }
      });
      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }private generateAccessToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '1h', // Extended from 15m to 1h
    });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: '30d', // Extended from 7d to 30d
    });
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    // Remove password and ensure all nullable fields are handled
    // (Prisma returns null for missing fields, but our type expects undefined)
    // We'll convert nulls to undefined for compatibility
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...rest } = user;
    const sanitized: any = { ...rest };
    Object.keys(sanitized).forEach((key) => {
      if (sanitized[key] === null) sanitized[key] = undefined;
    });
    return sanitized;
  }
}

export const authService = new AuthService();
