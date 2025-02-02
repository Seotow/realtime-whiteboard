import { Router } from 'express';

export const authRoutes = Router();

// Placeholder auth routes
authRoutes.post('/register', (req, res) => {
  res.json({ message: 'Register endpoint - coming soon' });
});

authRoutes.post('/login', (req, res) => {
  res.json({ message: 'Login endpoint - coming soon' });
});

authRoutes.post('/logout', (req, res) => {
  res.json({ message: 'Logout endpoint - coming soon' });
});

authRoutes.post('/refresh', (req, res) => {
  res.json({ message: 'Refresh token endpoint - coming soon' });
});

authRoutes.get('/me', (req, res) => {
  res.json({ message: 'Get user profile endpoint - coming soon' });
});
