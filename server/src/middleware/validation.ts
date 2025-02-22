import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '@/utils/logger';

export const validateInput = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((issue: any) => {
          const field = issue.path.slice(1).join('.'); // Remove 'body', 'query', or 'params' prefix
          return {
            field,
            message: issue.message,
            code: issue.code,
            received: issue.received,
          };
        });

        logger.warn('Validation error:', { 
          errors: errorMessages,
          path: req.path,
          method: req.method 
        });

        res.status(400).json({
          success: false,
          message: 'Please check your input and try again',
          details: 'The information you provided doesn\'t meet our requirements. Please review the highlighted fields.',
          errors: errorMessages,
          timestamp: new Date().toISOString(),
        });
      } else {
        logger.error('Unexpected validation error:', error);
        res.status(500).json({
          success: false,
          message: 'Something went wrong while processing your request',
          details: 'Please try again in a moment. If the problem persists, contact support.',
          timestamp: new Date().toISOString(),
        });
      }
    }
  };
};
