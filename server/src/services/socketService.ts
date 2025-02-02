import { Server } from 'socket.io';
import { logger } from '@/utils/logger';

export interface DrawingData {
  x: number;
  y: number;
  color: string;
  width: number;
  tool: string;
}

export interface CursorData {
  x: number;
  y: number;
  userId: string;
  userName: string;
}

export const setupSocketHandlers = (io: Server): void => {
  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Handle board joining
    socket.on('board:join', (boardId: string) => {
      socket.join(boardId);
      socket.to(boardId).emit('user:joined', {
        userId: socket.id,
        message: 'A user joined the board'
      });
      logger.info(`User ${socket.id} joined board: ${boardId}`);
    });

    // Handle board leaving
    socket.on('board:leave', (boardId: string) => {
      socket.leave(boardId);
      socket.to(boardId).emit('user:left', {
        userId: socket.id,
        message: 'A user left the board'
      });
      logger.info(`User ${socket.id} left board: ${boardId}`);
    });

    // Handle drawing events
    socket.on('draw:start', (data: DrawingData & { boardId: string }) => {
      socket.to(data.boardId).emit('draw:start', {
        ...data,
        userId: socket.id
      });
    });

    socket.on('draw:move', (data: DrawingData & { boardId: string }) => {
      socket.to(data.boardId).emit('draw:move', {
        ...data,
        userId: socket.id
      });
    });

    socket.on('draw:end', (data: { boardId: string }) => {
      socket.to(data.boardId).emit('draw:end', {
        userId: socket.id
      });
    });

    // Handle cursor movement
    socket.on('cursor:move', (data: CursorData & { boardId: string }) => {
      socket.to(data.boardId).emit('cursor:move', {
        ...data,
        userId: socket.id
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
};
