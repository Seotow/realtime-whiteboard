import { z } from 'zod';

// Board creation schema
export const createBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean().default(false)
});

// Board update schema
export const updateBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long').optional(),
  description: z.string().max(500, 'Description too long').optional(),
  isPublic: z.boolean().optional(),
  content: z.any().optional() // Fabric.js JSON
});

// Board sharing schema
export const shareBoardSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer')
});

// Board query schema
export const boardQuerySchema = z.object({
  page: z.preprocess(
    (val) => val ? parseInt(val as string, 10) : 1,
    z.number().min(1).default(1)
  ),
  limit: z.preprocess(
    (val) => val ? parseInt(val as string, 10) : 10,
    z.number().min(1).max(50).default(10)
  ),
  search: z.string().optional(),
  isPublic: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  )
});

// Canvas save schema
export const saveCanvasSchema = z.object({
  content: z.any(), // Fabric.js JSON content
  settings: z.any().optional() // Optional canvas settings (zoom, background, etc.)
});

export type CreateBoardRequest = z.infer<typeof createBoardSchema>;
export type UpdateBoardRequest = z.infer<typeof updateBoardSchema>;
export type ShareBoardRequest = z.infer<typeof shareBoardSchema>;
export type BoardQueryRequest = z.infer<typeof boardQuerySchema>;
export type SaveCanvasRequest = z.infer<typeof saveCanvasSchema>;
