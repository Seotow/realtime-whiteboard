import { io, Socket } from "socket.io-client";

// Types for socket events
export interface BoardUser {
    id: string;
    username: string;
    email: string;
    color: string;
    cursor?: { x: number; y: number };
    isActive: boolean;
    joinedAt: Date;
}

export interface DrawingData {
    x: number;
    y: number;
    color: string;
    width: number;
    tool: string;
    pressure?: number;
}

export interface CanvasAction {
    type: "add" | "update" | "delete" | "clear";
    objectId?: string;
    object?: Record<string, unknown>;
    boardId: string;
    userId: string;
    timestamp: Date;
}

export interface ServerToClientEvents {
    "board:state": (data: {
        users: BoardUser[];
        canvasState?: string;
        version: number;
    }) => void;
    "user:joined": (data: { user: BoardUser; totalUsers: number }) => void;
    "user:left": (data: {
        userId: string;
        username?: string;
        totalUsers: number;
    }) => void;
    "canvas:action": (data: CanvasAction) => void;
    "draw:start": (
        data: DrawingData & { userId: string; username: string }
    ) => void;
    "draw:move": (
        data: DrawingData & { userId: string; username: string }
    ) => void;
    "draw:end": (data: {
        boardId: string;
        object?: Record<string, unknown>;
        userId: string;
        username: string;
    }) => void;
    "cursor:move": (data: {
        x: number;
        y: number;
        userId: string;
        username: string;
        color: string;
    }) => void;
    "text:start": (data: {
        objectId: string;
        boardId: string;
        userId: string;
        username: string;
    }) => void;
    "text:update": (data: {
        objectId: string;
        text: string;
        boardId: string;
        userId: string;
        username: string;
    }) => void;
    "text:end": (data: {
        objectId: string;
        boardId: string;
        userId: string;
        username: string;
    }) => void;
    "selection:change": (data: {
        objects: string[];
        boardId: string;
        userId: string;
        username: string;
    }) => void;
    error: (data: { message: string; code?: string }) => void;
    pong: () => void;
}

export interface ClientToServerEvents {
    "board:join": (data: { boardId: string }) => void;
    "board:leave": (data: { boardId: string }) => void;
    "canvas:action": (data: CanvasAction) => void;
    "draw:start": (data: DrawingData & { boardId: string }) => void;
    "draw:move": (data: DrawingData & { boardId: string }) => void;
    "draw:end": (data: {
        boardId: string;
        object?: Record<string, unknown>;
    }) => void;
    "cursor:move": (data: { x: number; y: number; boardId: string }) => void;
    "text:start": (data: { objectId: string; boardId: string }) => void;
    "text:update": (data: {
        objectId: string;
        text: string;
        boardId: string;
    }) => void;
    "text:end": (data: { objectId: string; boardId: string }) => void;
    "selection:change": (data: { objects: string[]; boardId: string }) => void;
    ping: () => void;
}

class SocketService {
    private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
        null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private eventBatch: CanvasAction[] = [];
    private batchTimeout: NodeJS.Timeout | null = null;
    private readonly BATCH_DELAY = 16; // ~60fps batching
    private currentBoard: string | null = null;    connect(token?: string) {
        const serverUrl =
            import.meta.env.VITE_SOCKET_URL || "ws://localhost:3001";

        const socketConfig: Record<string, unknown> = {
            transports: ["websocket"],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
        };

        // Only add auth if token is provided
        if (token) {
            socketConfig.auth = { token };
        }

        this.socket = io(serverUrl, socketConfig);

        this.setupEventHandlers();
        this.setupErrorRecovery();
    }

    private setupEventHandlers() {
        if (!this.socket) return;

        this.socket.on("connect", () => {
            console.log("Connected to server");
            this.reconnectAttempts = 0;
        });

        this.socket.on("connect_error", (error) => {
            console.error("Connection error:", error);
            this.reconnectAttempts++;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error("Max reconnection attempts reached");
            }
        });

        // Keep connection alive
        setInterval(() => {
            if (this.socket?.connected) {
                this.socket.emit("ping");
            }
        }, 30000);
    }

    // Enhanced error recovery and reconnection handling
    private setupErrorRecovery() {
        if (!this.socket) return;

        // Handle disconnection with automatic recovery
        this.socket.on("disconnect", (reason) => {
            console.log("Disconnected from server:", reason);

            // Attempt to reconnect for certain disconnect reasons
            if (reason === "io server disconnect") {
                // Server initiated disconnect, try to reconnect
                console.log("Attempting to reconnect...");
                setTimeout(() => {
                    if (!this.socket?.connected) {
                        this.socket?.connect();
                    }
                }, 1000);
            }
        });        // Handle reconnection
        this.socket.on("connect", () => {
            if (this.reconnectAttempts > 0) {
                console.log(`Reconnected after ${this.reconnectAttempts} attempts`);
                this.reconnectAttempts = 0;
                // Re-join current board if we were in one
                if (this.currentBoard) {
                    this.joinBoard(this.currentBoard);
                }
            }
        });        // Handle errors gracefully
        this.socket.on("error", (error) => {
            console.error("Socket error:", error);
            // Don't crash the application, just log the error
        });
    }

    // Board operations
    joinBoard(boardId: string) {
        if (this.socket?.connected) {
            this.currentBoard = boardId;
            this.socket.emit("board:join", { boardId });
        }
    }

    leaveBoard(boardId: string) {
        if (this.socket?.connected) {
            this.socket.emit("board:leave", { boardId });
            if (this.currentBoard === boardId) {
                this.currentBoard = null;
            }
        }
    }

    // Batch canvas actions for better performance
    private flushEventBatch = () => {
        if (this.eventBatch.length === 0) return;

        const batch = [...this.eventBatch];
        this.eventBatch = [];

        // Send all batched events at once
        batch.forEach((action) => {
            this.socket?.emit("canvas:action", action);
        });

        this.batchTimeout = null;
    };

    private addToBatch = (action: CanvasAction) => {
        this.eventBatch.push(action);        // Clear existing timeout
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }

        // Set new timeout to flush batch
        this.batchTimeout = setTimeout(this.flushEventBatch, this.BATCH_DELAY);
    };

    // Canvas operations
    emitCanvasAction(action: CanvasAction): void {
        if (!this.socket) {
            console.warn("Cannot emit canvas action: not connected to board");
            return;
        }

        // For high-frequency actions, use batching
        if (action.type === "update" || action.type === "add") {
            this.addToBatch(action);
        } else {
            // For critical actions (delete, clear), send immediately
            this.socket.emit("canvas:action", action);
        }
    }

    // Drawing operations
    emitDrawStart(data: DrawingData & { boardId: string }) {
        if (this.socket?.connected) {
            this.socket.emit("draw:start", data);
        }
    }

    emitDrawMove(data: DrawingData & { boardId: string }) {
        if (this.socket?.connected) {
            this.socket.emit("draw:move", data);
        }
    }    emitDrawEnd(data: { boardId: string; object?: Record<string, unknown> }) {
        if (this.socket?.connected) {
            this.socket.emit("draw:end", data);
        }
    }

    // Cursor operations
    emitCursorMove(data: { x: number; y: number; boardId: string }) {
        if (this.socket?.connected) {
            this.socket.emit("cursor:move", data);
        }
    }

    // Text operations
    emitTextStart(data: { objectId: string; boardId: string }) {
        if (this.socket?.connected) {
            this.socket.emit("text:start", data);
        }
    }

    emitTextUpdate(data: { objectId: string; text: string; boardId: string }) {
        if (this.socket?.connected) {
            this.socket.emit("text:update", data);
        }
    }

    emitTextEnd(data: { objectId: string; boardId: string }) {
        if (this.socket?.connected) {
            this.socket.emit("text:end", data);
        }
    }

    // Selection operations
    emitSelectionChange(data: { objects: string[]; boardId: string }) {
        if (this.socket?.connected) {
            this.socket.emit("selection:change", data);
        }
    }    // Event listeners
    on<T extends keyof ServerToClientEvents>(
        event: T,
        callback: ServerToClientEvents[T]
    ) {
        if (this.socket) {
            // TypeScript workaround for Socket.IO event typing
            (this.socket as Socket).on(event as string, callback as (...args: unknown[]) => void);
        }
    }

    off<T extends keyof ServerToClientEvents>(
        event: T,
        callback?: ServerToClientEvents[T]
    ) {
        if (this.socket) {
            // TypeScript workaround for Socket.IO event typing
            if (callback) {
                (this.socket as Socket).off(event as string, callback as (...args: unknown[]) => void);
            } else {
                (this.socket as Socket).off(event as string);
            }
        }
    }

    // Connection status
    isConnected(): boolean {
        return this.socket?.connected || false;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }
}

export const socketService = new SocketService();
