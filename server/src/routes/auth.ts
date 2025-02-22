import { Router, Request, Response } from 'express';
import { authService } from '@/services/authService';
import { authenticateToken } from '@/middleware/auth';
import { validateInput } from '@/middleware/validation';
import { registerSchema, loginSchema, refreshTokenSchema } from '@/schemas/authSchemas';
import { logger } from '@/utils/logger';

export const authRoutes = Router();

// Register endpoint
authRoutes.post('/register', validateInput(registerSchema), async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;
    
    const result = await authService.register({ email, username, password });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Registration failed:', error);
    
    const message = error instanceof Error ? error.message : 'Registration failed';
    const statusCode = message.includes('already exists') ? 409 : 400;
    
    res.status(statusCode).json({
      success: false,
      message,
    });
  }
});

// Login endpoint
authRoutes.post('/login', validateInput(loginSchema), async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const result = await authService.login({ email, password });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    logger.error('Login failed:', error);
    
    const message = error instanceof Error ? error.message : 'Login failed';
    const statusCode = message.includes('Invalid') ? 401 : 400;
    
    res.status(statusCode).json({
      success: false,
      message,
    });
  }
});

// Refresh token endpoint
authRoutes.post('/refresh', validateInput(refreshTokenSchema), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    const result = await authService.refreshToken(refreshToken);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Token refresh failed:', error);
    
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
    });
  }
});

// Get current user profile
authRoutes.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
      return;
    }

    const user = await authService.getUserById(req.user.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Remove sensitive information
    const { password, ...userProfile } = user;
    
    res.json({
      success: true,
      data: { user: userProfile },
    });
  } catch (error) {
    logger.error('Get profile failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
});

// Logout endpoint (for client-side token cleanup)
authRoutes.post('/logout', authenticateToken, (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logout successful',
  });
});
