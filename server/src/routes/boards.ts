import { Router, Request, Response, NextFunction } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { validateInput } from '../middleware/validation';
import { BoardService } from '../services/boardService';
import { 
  createBoardSchema, 
  updateBoardSchema, 
  shareBoardSchema, 
  boardQuerySchema,
  saveCanvasSchema
} from '../schemas/boardSchemas';
import { z } from 'zod';

export const boardRoutes = Router();

// All board routes require authentication
boardRoutes.use(authenticateToken);

// Get user's boards
boardRoutes.get('/', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    
    // Parse and validate query parameters with defaults
    const queryResult = boardQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid query parameters',
        errors: queryResult.error.errors
      });
      return;
    }
    
    const result = await BoardService.getUserBoards(userId, queryResult.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get public boards (templates, featured boards)
boardRoutes.get('/public', validateInput(z.object({ query: boardQuerySchema })), async (req, res, next) => {
  try {
    const query = req.query as any;
    
    const result = await BoardService.getPublicBoards(query);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get accessed boards (boards user has viewed via shared links)
boardRoutes.get('/accessed', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    
    // Parse and validate query parameters with defaults
    const queryResult = boardQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid query parameters',
        errors: queryResult.error.errors
      });
      return;
    }
    
    const result = await BoardService.getAccessedBoards(userId, queryResult.data);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Create new board
boardRoutes.post('/', validateInput(z.object({ body: createBoardSchema })), async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const boardData = req.body;
    
    const board = await BoardService.createBoard(userId, boardData);
    res.status(201).json(board);
  } catch (error) {
    next(error);
  }
});

// Get board by ID (with optional auth for public boards)
boardRoutes.get('/:id', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;
    
    const board = await BoardService.getBoardById(id, userId);
    res.json(board);
  } catch (error) {
    next(error);
  }
});

// Update board
boardRoutes.put('/:id', [optionalAuth, validateInput(z.object({ body: updateBoardSchema }))], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || null;
    const updateData = req.body;
    
    const board = await BoardService.updateBoard(id, userId, updateData);
    res.json(board);
  } catch (error) {
    next(error);
  }
});

// Delete board
boardRoutes.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    
    const result = await BoardService.deleteBoard(id, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Add collaborator to board
boardRoutes.post('/:id/collaborators', validateInput(z.object({ body: shareBoardSchema })), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { email, role } = req.body;
    
    // Find user by email
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const collaboratorUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true, username: true, email: true }
    });
    
    if (!collaboratorUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const result = await BoardService.addCollaborator(id, userId, collaboratorUser.id, role);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Remove collaborator from board
boardRoutes.delete('/:id/collaborators/:collaboratorId', async (req, res, next) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user!.userId;
    
    const result = await BoardService.removeCollaborator(id, userId, collaboratorId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get board activities
boardRoutes.get('/:id/activities', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const activities = await BoardService.getBoardActivities(id, userId, limit);
    res.json(activities);
  } catch (error) {
    next(error);
  }
});

// Save canvas content
boardRoutes.post('/:id/save', validateInput(z.object({ body: saveCanvasSchema })), async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const { content, settings } = req.body;
    
    const result = await BoardService.saveCanvasContent(id, userId, content, settings);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Save canvas content (for public boards)
boardRoutes.put('/:id/content', [optionalAuth, validateInput(z.object({ body: saveCanvasSchema }))], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || 'anonymous';
    const { content } = req.body;
    
    const board = await BoardService.updateBoard(id, userId, { content });
    res.json(board);
  } catch (error) {
    next(error);
  }
});
