import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { authService } from './authService';

// Enhanced interfaces for real-time collaboration
export interface DrawingData {
  x: number;
  y: number;
  color: string;
  width: number;
  tool: string;
  pressure?: number;
}

export interface CursorData {
  x: number;
  y: number;
  userId: string;
  userName: string;
  color: string;
}

export interface BoardUser {
  id: string;
  username: string;
  email: string;
  color: string;
  cursor?: { x: number; y: number };
  isActive: boolean;
  joinedAt: Date;
}

export interface CanvasAction {
  type: 'add' | 'update' | 'delete' | 'clear';
  objectId?: string;
  object?: any; // Fabric.js object
  boardId: string;
  userId: string;
  timestamp: Date;
}

export interface RoomState {
  boardId: string;
  users: Map<string, BoardUser>;
  canvasState?: any; // Latest canvas state
  version: number; // For optimistic updates
}

// In-memory room management
class RoomManager {
  private rooms: Map<string, RoomState> = new Map();
  private userColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];

  getOrCreateRoom(boardId: string): RoomState {
    if (!this.rooms.has(boardId)) {
      this.rooms.set(boardId, {
        boardId,
        users: new Map(),
        version: 0
      });
    }
    return this.rooms.get(boardId)!;
  }

  addUserToRoom(boardId: string, user: BoardUser): void {
    const room = this.getOrCreateRoom(boardId);
    room.users.set(user.id, user);
  }

  removeUserFromRoom(boardId: string, userId: string): void {
    const room = this.rooms.get(boardId);
    if (room) {
      room.users.delete(userId);
      if (room.users.size === 0) {
        this.rooms.delete(boardId);
      }
    }
  }

  getUsersInRoom(boardId: string): BoardUser[] {
    const room = this.rooms.get(boardId);
    return room ? Array.from(room.users.values()) : [];
  }

  updateCanvasState(boardId: string, canvasState: any): void {
    const room = this.rooms.get(boardId);
    if (room) {
      room.canvasState = canvasState;
      room.version += 1;
    }
  }

  getAvailableColor(boardId: string): string {
    const room = this.getOrCreateRoom(boardId);
    const usedColors = Array.from(room.users.values()).map(u => u.color);
    return this.userColors.find(color => !usedColors.includes(color)) || this.userColors[0];
  }
}

const roomManager = new RoomManager();

// List of random names for anonymous users
const anonymousNames = [
  'Curious Cat', 'Brave Bear', 'Swift Fox', 'Wise Owl', 'Happy Panda',
  'Cool Penguin', 'Clever Dolphin', 'Bold Eagle', 'Gentle Deer', 'Playful Otter',
  'Mighty Lion', 'Graceful Swan', 'Friendly Elephant', 'Quick Rabbit', 'Strong Wolf',
  'Elegant Horse', 'Cheerful Parrot', 'Creative Octopus', 'Adventurous Monkey', 'Peaceful Dove'
];

// Authentication middleware for sockets (with optional auth for public boards)
const authenticateSocket = async (socket: Socket, next: Function) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    console.log('Socket auth: token received:', token ? 'present' : 'missing');
    console.log('Socket auth: auth object:', socket.handshake.auth);
    console.log('Socket auth: authorization header:', socket.handshake.headers.authorization);
    
    if (!token) {
      console.log('Socket auth: No token provided, allowing anonymous access for public boards');
      // Allow anonymous access - create anonymous user with random name
      const randomName = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
      socket.data.user = {
        userId: `anonymous_${socket.id}`,
        username: randomName,
        email: 'anonymous@example.com'
      };
      return next();
    }

    console.log('Socket auth: Verifying token...');
    const decoded = authService.verifyToken(token);
    console.log('Socket auth: Token verified successfully:', decoded);
    socket.data.user = decoded;
    next();
  } catch (error) {
    console.error('Socket auth: Token verification failed:', error);
    // For token verification errors, still allow anonymous access
    console.log('Socket auth: Falling back to anonymous access');
    const randomName = anonymousNames[Math.floor(Math.random() * anonymousNames.length)];
    socket.data.user = {
      userId: `anonymous_${socket.id}`,
      username: randomName,
      email: 'anonymous@example.com'
    };
    next();
  }
};

export const setupSocketHandlers = (io: Server): void => {
  // Add authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.info(`User connected: ${user.username} (${socket.id})`);

    // Handle board joining with authentication
    socket.on('board:join', async (data: { boardId: string }) => {
      try {
        const { boardId } = data;
        
        // TODO: Verify user has access to board (implement board permission check)
        
        // Join socket room
        socket.join(boardId);
        
        // Add user to room state
        const boardUser: BoardUser = {
          id: user.userId,
          username: user.username,
          email: user.email,
          color: roomManager.getAvailableColor(boardId),
          isActive: true,
          joinedAt: new Date()
        };
        
        roomManager.addUserToRoom(boardId, boardUser);
        
        // Get current room state
        const roomUsers = roomManager.getUsersInRoom(boardId);
        const room = roomManager.getOrCreateRoom(boardId);
        
        // Send current state to joining user
        socket.emit('board:state', {
          users: roomUsers,
          canvasState: room.canvasState,
          version: room.version
        });
        
        // Notify other users
        socket.to(boardId).emit('user:joined', {
          user: boardUser,
          totalUsers: roomUsers.length
        });
        
        logger.info(`User ${user.username} joined board: ${boardId}`);
      } catch (error) {
        logger.error('Error joining board:', error);
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    // Handle board leaving
    socket.on('board:leave', (data: { boardId: string }) => {
      const { boardId } = data;
      
      socket.leave(boardId);
      roomManager.removeUserFromRoom(boardId, user.userId);
      
      const remainingUsers = roomManager.getUsersInRoom(boardId);
      
      socket.to(boardId).emit('user:left', {
        userId: user.userId,
        totalUsers: remainingUsers.length
      });
      
      logger.info(`User ${user.username} left board: ${boardId}`);
    });

    // Handle canvas actions (add, update, delete objects)
    socket.on('canvas:action', (data: CanvasAction) => {
      try {
        const actionWithUser = {
          ...data,
          userId: user.userId,
          timestamp: new Date()
        };
        
        // Update room canvas state
        if (data.type === 'add' || data.type === 'update') {
          roomManager.updateCanvasState(data.boardId, data.object);
        }
        
        // Broadcast to other users in the room
        socket.to(data.boardId).emit('canvas:action', actionWithUser);
        
        logger.debug(`Canvas action ${data.type} by ${user.username} in board ${data.boardId}`);
      } catch (error) {
        logger.error('Error handling canvas action:', error);
        socket.emit('error', { message: 'Failed to process canvas action' });
      }
    });

    // Handle drawing events (real-time drawing)
    socket.on('draw:start', (data: DrawingData & { boardId: string }) => {
      socket.to(data.boardId).emit('draw:start', {
        ...data,
        userId: user.userId,
        username: user.username
      });
    });

    socket.on('draw:move', (data: DrawingData & { boardId: string }) => {
      socket.to(data.boardId).emit('draw:move', {
        ...data,
        userId: user.userId,
        username: user.username
      });
    });

    socket.on('draw:end', (data: { boardId: string; object?: any }) => {
      socket.to(data.boardId).emit('draw:end', {
        ...data,
        userId: user.userId,
        username: user.username
      });
      
      // Save the completed drawing object
      if (data.object) {
        roomManager.updateCanvasState(data.boardId, data.object);
      }
    });

    // Handle cursor movement with user info
    socket.on('cursor:move', (data: { x: number; y: number; boardId: string }) => {
      const room = roomManager.getOrCreateRoom(data.boardId);
      const boardUser = room.users.get(user.userId);
      
      if (boardUser) {
        boardUser.cursor = { x: data.x, y: data.y };
        
        socket.to(data.boardId).emit('cursor:move', {
          x: data.x,
          y: data.y,
          userId: user.userId,
          username: user.username,
          color: boardUser.color
        });
      }
    });

    // Handle text editing collaboration
    socket.on('text:start', (data: { objectId: string; boardId: string }) => {
      socket.to(data.boardId).emit('text:start', {
        ...data,
        userId: user.userId,
        username: user.username
      });
    });

    socket.on('text:update', (data: { objectId: string; text: string; boardId: string }) => {
      socket.to(data.boardId).emit('text:update', {
        ...data,
        userId: user.userId,
        username: user.username
      });
    });

    socket.on('text:end', (data: { objectId: string; boardId: string }) => {
      socket.to(data.boardId).emit('text:end', {
        ...data,
        userId: user.userId,
        username: user.username
      });
    });

    // Handle selection sharing
    socket.on('selection:change', (data: { objects: string[]; boardId: string }) => {
      socket.to(data.boardId).emit('selection:change', {
        ...data,
        userId: user.userId,
        username: user.username
      });
    });

    // Handle reconnection
    socket.on('reconnect', () => {
      logger.info(`User ${user.username} reconnected`);
    });

    // Handle connection errors
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${user.username}:`, error);
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User ${user.username} disconnected: ${reason}`);
      
      // Remove user from all rooms they were in
      const rooms = Array.from(socket.rooms);
      rooms.forEach(roomId => {
        if (roomId !== socket.id) { // Skip the socket's own room
          roomManager.removeUserFromRoom(roomId, user.userId);
          const remainingUsers = roomManager.getUsersInRoom(roomId);
          
          socket.to(roomId).emit('user:left', {
            userId: user.userId,
            username: user.username,
            totalUsers: remainingUsers.length
          });
        }
      });
    });

    // Heartbeat for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  // Handle connection errors at server level
  io.engine.on('connection_error', (err) => {
    logger.error('Socket connection error:', err);
  });
};
