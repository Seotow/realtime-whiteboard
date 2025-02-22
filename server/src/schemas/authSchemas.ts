import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address (e.g., user@example.com)')
      .max(254, 'Email address is too long (maximum 254 characters)'),
    username: z
      .string()
      .min(1, 'Username is required')
      .min(3, 'Username must be at least 3 characters long')
      .max(30, 'Username must be less than 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/, 
        'Username can only contain letters, numbers, underscores, and hyphens'
      ),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(8, 'Password must be at least 8 characters long')
      .regex(
        /^(?=.*[a-z])/, 
        'Password must contain at least one lowercase letter'
      )
      .regex(
        /^(?=.*[A-Z])/, 
        'Password must contain at least one uppercase letter'
      )
      .regex(
        /^(?=.*\d)/, 
        'Password must contain at least one number'
      )
      .regex(
        /^(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/, 
        'Password must contain at least one special character (!@#$%^&*)'
      ),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(1, 'Password is required'),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, 'Refresh token is required'),
  }),
});
