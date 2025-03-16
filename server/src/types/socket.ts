// Socket.io event types for real-time collaboration

export interface ServerToClientEvents {
  // Board events
  'board:state': (data: {
    users: BoardUser[];
    canvasState?: any;
    version: number;
  }) => void;
  
  // User events
  'user:joined': (data: {
    user: BoardUser;
    totalUsers: number;
  }) => void;
  
  'user:left': (data: {
    userId: string;
    username?: string;
    totalUsers: number;
  }) => void;
  
  // Canvas events
  'canvas:action': (data: CanvasAction) => void;
  
  // Drawing events
  'draw:start': (data: DrawingData & {
    userId: string;
    username: string;
  }) => void;
  
  'draw:move': (data: DrawingData & {
    userId: string;
    username: string;
  }) => void;
  
  'draw:end': (data: {
    boardId: string;
    object?: any;
    userId: string;
    username: string;
  }) => void;
  
  // Cursor events
  'cursor:move': (data: {
    x: number;
    y: number;
    userId: string;
    username: string;
    color: string;
  }) => void;
  
  // Text editing events
  'text:start': (data: {
    objectId: string;
    boardId: string;
    userId: string;
    username: string;
  }) => void;
  
  'text:update': (data: {
    objectId: string;
    text: string;
    boardId: string;
    userId: string;
    username: string;
  }) => void;
  
  'text:end': (data: {
    objectId: string;
    boardId: string;
    userId: string;
    username: string;
  }) => void;
  
  // Selection events
  'selection:change': (data: {
    objects: string[];
    boardId: string;
    userId: string;
    username: string;
  }) => void;
  
  // System events
  'error': (data: { message: string; code?: string }) => void;
  'pong': () => void;
}

export interface ClientToServerEvents {
  // Board events
  'board:join': (data: { boardId: string }) => void;
  'board:leave': (data: { boardId: string }) => void;
  
  // Canvas events
  'canvas:action': (data: CanvasAction) => void;
  
  // Drawing events
  'draw:start': (data: DrawingData & { boardId: string }) => void;
  'draw:move': (data: DrawingData & { boardId: string }) => void;
  'draw:end': (data: { boardId: string; object?: any }) => void;
  
  // Cursor events
  'cursor:move': (data: { x: number; y: number; boardId: string }) => void;
  
  // Text editing events
  'text:start': (data: { objectId: string; boardId: string }) => void;
  'text:update': (data: { objectId: string; text: string; boardId: string }) => void;
  'text:end': (data: { objectId: string; boardId: string }) => void;
  
  // Selection events
  'selection:change': (data: { objects: string[]; boardId: string }) => void;
  
  // System events
  'reconnect': () => void;
  'ping': () => void;
}

export interface InterServerEvents {
  // Events between server instances (for scaling)
  'board:sync': (data: { boardId: string; action: CanvasAction }) => void;
  'user:broadcast': (data: { boardId: string; event: string; data: any }) => void;
}

export interface SocketData {
  user: {
    userId: string;
    username: string;
    email: string;
  };
}

// Re-export interfaces from socketService
export interface DrawingData {
  x: number;
  y: number;
  color: string;
  width: number;
  tool: string;
  pressure?: number;
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

// Tool types for drawing
export type DrawingTool = 
  | 'pen' 
  | 'brush' 
  | 'eraser' 
  | 'line' 
  | 'rectangle' 
  | 'circle' 
  | 'arrow' 
  | 'text' 
  | 'select';

// Canvas object types
export interface CanvasObject {
  id: string;
  type: string;
  left: number;
  top: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  angle?: number;
  scaleX?: number;
  scaleY?: number;
  visible?: boolean;
  selectable?: boolean;
  evented?: boolean;
  opacity?: number;
  shadow?: any;
  clipPath?: any;
  
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: string;
  textAlign?: string;
  
  // Path specific (for drawing)
  path?: string;
  
  // Image specific
  src?: string;
  crossOrigin?: string;
  
  // Custom properties
  userId?: string;
  timestamp?: Date;
  version?: number;
}

// Real-time action types
export interface RealtimeAction {
  id: string;
  type: 'canvas:action' | 'draw:start' | 'draw:move' | 'draw:end' | 'cursor:move';
  data: any;
  userId: string;
  boardId: string;
  timestamp: Date;
}

// Connection status
export interface ConnectionStatus {
  isConnected: boolean;
  latency?: number;
  reconnectAttempts?: number;
  lastHeartbeat?: Date;
}
