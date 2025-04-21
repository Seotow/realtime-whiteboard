import { useEffect, useRef, useState, useCallback } from "react";
import * as fabric from "fabric";
import { socketService } from "../../../services/socketService";
import { useBoardStore } from "../../../stores/boardStore";
import type { BoardUser } from "../../../services/socketService";

interface UseRealtimeCollaborationProps {
    fabricCanvasRef: React.MutableRefObject<fabric.Canvas | null>;
    boardId: string;
    isCanvasInitialized: boolean;
}

interface RemoteCursor {
    userId: string;
    username: string;
    color: string;
    x: number;
    y: number;
    lastUpdate: number;
}

export const useRealtimeCollaboration = ({
    fabricCanvasRef,
    boardId,
    isCanvasInitialized,
}: UseRealtimeCollaborationProps) => {
    const [connectedUsers, setConnectedUsers] = useState<BoardUser[]>([]);
    const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([]);
    const cursorTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const lastCursorUpdateRef = useRef<number>(0);
    const isJoinedRef = useRef(false);
      // Get board store to sync connected users
    const { setConnectedUsers: setBoardConnectedUsers } = useBoardStore();

    // Sync connected users with board store whenever they change
    useEffect(() => {
        setBoardConnectedUsers(connectedUsers);
    }, [connectedUsers, setBoardConnectedUsers]);

    // Join board when canvas is initialized
    useEffect(() => {
        if (isCanvasInitialized && boardId && !isJoinedRef.current) {
            console.log('Joining board for real-time collaboration:', boardId);
            socketService.joinBoard(boardId);
            isJoinedRef.current = true;
        }

        return () => {
            if (isJoinedRef.current) {
                console.log('Leaving board on cleanup:', boardId);
                socketService.leaveBoard(boardId);
                isJoinedRef.current = false;
            }
        };
    }, [isCanvasInitialized, boardId]);    // Handle board state updates
    useEffect(() => {        const handleBoardState = (data: {
            users: BoardUser[];
            canvasState?: string;
            version: number;
        }) => {
            console.log('Received board state:', data);
            setConnectedUsers(data.users);
        };

        const handleUserJoined = (data: { user: BoardUser; totalUsers: number }) => {
            console.log('User joined board:', data.user.username);
            setConnectedUsers(prev => {
                const filtered = prev.filter(u => u.id !== data.user.id);
                return [...filtered, data.user];
            });
        };

        const handleUserLeft = (data: { userId: string; username?: string; totalUsers: number }) => {
            console.log('User left board:', data.username || data.userId);
            setConnectedUsers(prev => prev.filter(u => u.id !== data.userId));
            
            // Remove cursor for this user
            setRemoteCursors(prev => prev.filter(c => c.userId !== data.userId));
            
            // Clear timeout for this user
            const timeout = cursorTimeoutRef.current.get(data.userId);
            if (timeout) {
                clearTimeout(timeout);
                cursorTimeoutRef.current.delete(data.userId);
            }
        };

        socketService.on('board:state', handleBoardState);
        socketService.on('user:joined', handleUserJoined);
        socketService.on('user:left', handleUserLeft);        return () => {
            socketService.off('board:state', handleBoardState);
            socketService.off('user:joined', handleUserJoined);
            socketService.off('user:left', handleUserLeft);
        };
    }, []); // Remove setBoardConnectedUsers from dependencies// Handle cursor movements
    useEffect(() => {
        const timeoutMap = cursorTimeoutRef.current;
        
        const handleRemoteCursorMove = (data: {
            x: number;
            y: number;
            userId: string;
            username: string;
            color: string;
        }) => {
            const now = Date.now();
            
            setRemoteCursors(prev => {
                const filtered = prev.filter(c => c.userId !== data.userId);
                return [...filtered, {
                    userId: data.userId,
                    username: data.username,
                    color: data.color,
                    x: data.x,
                    y: data.y,
                    lastUpdate: now,
                }];
            });

            // Clear existing timeout for this user
            const existingTimeout = timeoutMap.get(data.userId);
            if (existingTimeout) {
                clearTimeout(existingTimeout);
            }

            // Set timeout to hide cursor after inactivity
            const timeout = setTimeout(() => {
                setRemoteCursors(prev => prev.filter(c => c.userId !== data.userId));
                timeoutMap.delete(data.userId);
            }, 3000); // Hide cursor after 3 seconds of inactivity

            timeoutMap.set(data.userId, timeout);
        };

        socketService.on('cursor:move', handleRemoteCursorMove);        return () => {
            socketService.off('cursor:move', handleRemoteCursorMove);
            // Clear all timeouts
            timeoutMap.forEach(timeout => clearTimeout(timeout));
            timeoutMap.clear();
        };
    }, []);// Send cursor position with throttling
    const sendCursorPosition = useCallback((x: number, y: number) => {
        const now = Date.now();
        
        // Throttle cursor updates to max 60fps (16ms)
        if (now - lastCursorUpdateRef.current < 16) {
            return;
        }
        
        lastCursorUpdateRef.current = now;
        socketService.emitCursorMove({ x, y, boardId });
    }, [boardId]);

    // Track local cursor movement
    useEffect(() => {
        if (!fabricCanvasRef.current || !isCanvasInitialized) return;

        const canvas = fabricCanvasRef.current;
          const handleMouseMove = (event: fabric.TEvent) => {
            // Get mouse position from event
            const pointer = canvas.getPointer(event.e);
            if (!pointer) return;
            
            const { x, y } = pointer;
            sendCursorPosition(x, y);
        };

        canvas.on('mouse:move', handleMouseMove);

        return () => {
            canvas.off('mouse:move', handleMouseMove);
        };
    }, [fabricCanvasRef, isCanvasInitialized, sendCursorPosition]);

    // Render remote cursors
    useEffect(() => {
        if (!fabricCanvasRef.current || !isCanvasInitialized) return;

        const canvas = fabricCanvasRef.current;
        const canvasElement = canvas.getElement().parentElement;
        
        if (!canvasElement) return;

        // Remove existing cursor elements
        const existingCursors = canvasElement.querySelectorAll('[data-remote-cursor]');
        existingCursors.forEach(cursor => cursor.remove());

        // Add new cursors
        remoteCursors.forEach(cursor => {
            const cursorElement = document.createElement('div');
            cursorElement.setAttribute('data-remote-cursor', cursor.userId);
            cursorElement.style.position = 'absolute';
            cursorElement.style.left = `${cursor.x}px`;
            cursorElement.style.top = `${cursor.y}px`;
            cursorElement.style.width = '20px';
            cursorElement.style.height = '20px';
            cursorElement.style.pointerEvents = 'none';
            cursorElement.style.zIndex = '1000';
            cursorElement.style.transform = 'translate(-2px, -2px)';
            
            // Cursor icon (circle + name)
            cursorElement.innerHTML = `
                <div style="position: relative;">
                    <div style="
                        width: 12px; 
                        height: 12px; 
                        border-radius: 50%; 
                        background-color: ${cursor.color}; 
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    "></div>
                    <div style="
                        position: absolute; 
                        top: 16px; 
                        left: 0; 
                        background-color: ${cursor.color}; 
                        color: white; 
                        padding: 2px 6px; 
                        border-radius: 4px; 
                        font-size: 12px; 
                        font-weight: 500;
                        white-space: nowrap;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                    ">${cursor.username}</div>
                </div>
            `;
            
            canvasElement.appendChild(cursorElement);
        });

        return () => {
            // Cleanup on unmount
            const cursors = canvasElement.querySelectorAll('[data-remote-cursor]');
            cursors.forEach(cursor => cursor.remove());
        };
    }, [fabricCanvasRef, isCanvasInitialized, remoteCursors]);

    return {
        connectedUsers,
        remoteCursors,
        isConnected: isJoinedRef.current,
    };
};
