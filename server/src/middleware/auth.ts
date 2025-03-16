import { Request, Response, NextFunction } from 'express';
import { authService } from '@/services/authService';
import { JwtPayload } from '@/types/auth';
import { logger } from '@/utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth: Authorization header:', authHeader);
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    console.log('Auth: Extracted token:', token ? 'present' : 'missing');

    if (!token) {
      console.log('Auth: No token provided');
      res.status(401).json({
        success: false,
        message: 'Access token required',
      });
      return;
    }

    console.log('Auth: Verifying token with authService');
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = authService.verifyToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};
