import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { User, CreateUserRequest, LoginRequest, AuthResponse, JwtPayload } from '@/types/auth';
import { logger } from '@/utils/logger';

// In-memory user storage (replace with database in production)
const users: User[] = [];

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  async register(userData: CreateUserRequest): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const existingUser = users.find(u => u.email === userData.email || u.username === userData.username);
      if (existingUser) {
        throw new Error('User with this email or username already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create new user
      const newUser: User = {
        id: uuidv4(),
        email: userData.email,
        username: userData.username,
        password: hashedPassword,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      users.push(newUser);

      // Generate tokens
      const token = this.generateAccessToken(newUser);
      const refreshToken = this.generateRefreshToken(newUser);

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
      const user = users.find(u => u.email === loginData.email);
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
      
      const user = users.find(u => u.id === decoded.userId);
      if (!user || !user.isActive) {
        throw new Error('Invalid refresh token');
      }

      const newToken = this.generateAccessToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

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
    return users.find(u => u.id === userId) || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return users.find(u => u.email === email) || null;
  }

  verifyToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JwtPayload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }  private generateAccessToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    return jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: '15m',
    });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      username: user.username,
    };

    return jwt.sign(payload, this.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });
  }

  private sanitizeUser(user: User): Omit<User, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

export const authService = new AuthService();
