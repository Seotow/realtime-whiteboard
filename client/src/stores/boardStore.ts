import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
    Board,
    CreateBoardData,
    UpdateBoardData,
    FabricCanvasData,
} from "../services/boardApi";
import { boardApi } from "../services/boardApi";
import type { BoardUser, CanvasAction } from "../services/socketService";
import { socketService } from "../services/socketService";

export interface BoardState {
    // Current board data
    currentBoard: Board | null;
    isLoading: boolean;
    error: string | null;    // Board list
    boards: Board[];
    publicBoards: Board[];
    accessedBoards: Board[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    } | null;

    // Real-time collaboration
    connectedUsers: BoardUser[];
    canvasVersion: number;
    isConnected: boolean;

    // Actions
    fetchBoards: (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }) => Promise<void>;    fetchPublicBoards: (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }) => Promise<void>;
    fetchAccessedBoards: (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }) => Promise<void>;
    fetchBoard: (id: string) => Promise<void>;
    createBoard: (data: CreateBoardData) => Promise<Board>;
    updateBoard: (id: string, data: UpdateBoardData) => Promise<void>;
    deleteBoard: (id: string) => Promise<void>;

    // Real-time actions
    joinBoard: (boardId: string) => void;
    leaveBoard: (boardId: string) => void;
    emitCanvasAction: (action: CanvasAction) => void;
    
    // Collaboration actions
    addCollaborator: (boardId: string, email: string, role?: string) => Promise<void>;
    removeCollaborator: (boardId: string, collaboratorId: string) => Promise<void>;
    generateShareableLink: (boardId: string, makePublic?: boolean) => Promise<{ shareUrl: string; isPublic: boolean }>;
    
    // Canvas save/load actions
    saveCanvasContent: (
        boardId: string,
        content: FabricCanvasData,
        settings?: Record<string, unknown>
    ) => Promise<void>;

    // State updates
    setCurrentBoard: (board: Board | null) => void;
    setConnectedUsers: (users: BoardUser[]) => void;
    addUser: (user: BoardUser) => void;
    removeUser: (userId: string) => void;
    updateCanvasVersion: (version: number) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}

export const useBoardStore = create<BoardState>()(
    subscribeWithSelector((set) => ({        // Initial state
        currentBoard: null,
        isLoading: false,
        error: null,
        boards: [],
        publicBoards: [],
        accessedBoards: [],
        pagination: null,
        connectedUsers: [],
        canvasVersion: 0,
        isConnected: false,

        // Board CRUD operations
        fetchBoards: async (params) => {
            set({ isLoading: true, error: null });
            try {
                const response = await boardApi.getUserBoards(params);
                set({
                    boards: response.boards,
                    pagination: response.pagination,
                    isLoading: false,
                });
            } catch (error) {
                set({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch boards",
                    isLoading: false,
                });
            }
        },        fetchPublicBoards: async (params) => {
            set({ isLoading: true, error: null });
            try {
                const response = await boardApi.getPublicBoards(params);
                set({
                    publicBoards: response.boards,
                    pagination: response.pagination,
                    isLoading: false,
                });
            } catch (error) {
                set({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch public boards",
                    isLoading: false,
                });
            }
        },

        fetchAccessedBoards: async (params) => {
            set({ isLoading: true, error: null });
            try {
                const response = await boardApi.getAccessedBoards(params);
                set({
                    accessedBoards: response.boards,
                    pagination: response.pagination,
                    isLoading: false,
                });
            } catch (error) {
                set({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch accessed boards",
                    isLoading: false,
                });
            }
        },

        fetchBoard: async (id) => {
            set({ isLoading: true, error: null });
            try {
                const board = await boardApi.getBoardById(id);
                set({ currentBoard: board, isLoading: false });
            } catch (error) {
                set({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to fetch board",
                    isLoading: false,
                });
            }
        },

        createBoard: async (data) => {
            set({ isLoading: true, error: null });
            try {
                const board = await boardApi.createBoard(data);
                set((state) => ({
                    boards: [board, ...state.boards],
                    isLoading: false,
                }));
                return board;
            } catch (error) {
                set({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to create board",
                    isLoading: false,
                });
                throw error;
            }
        },

        updateBoard: async (id, data) => {
            set({ isLoading: true, error: null });
            try {
                const updatedBoard = await boardApi.updateBoard(id, data);
                set((state) => ({
                    currentBoard:
                        state.currentBoard?.id === id
                            ? updatedBoard
                            : state.currentBoard,
                    boards: state.boards.map((board) =>
                        board.id === id ? updatedBoard : board
                    ),
                    isLoading: false,
                }));
            } catch (error) {
                set({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to update board",
                    isLoading: false,
                });
            }
        },

        deleteBoard: async (id) => {
            set({ isLoading: true, error: null });
            try {
                await boardApi.deleteBoard(id);
                set((state) => ({
                    boards: state.boards.filter((board) => board.id !== id),
                    currentBoard:
                        state.currentBoard?.id === id
                            ? null
                            : state.currentBoard,
                    isLoading: false,
                }));
            } catch (error) {
                set({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to delete board",
                    isLoading: false,
                });
            }
        },

        // Real-time operations
        joinBoard: (boardId) => {
            socketService.joinBoard(boardId);
            set({ isConnected: true });
        },

        leaveBoard: (boardId) => {
            socketService.leaveBoard(boardId);
            set({ isConnected: false, connectedUsers: [] });
        },

        emitCanvasAction: (action) => {
            socketService.emitCanvasAction(action);
        },

        // Collaboration operations
        addCollaborator: async (boardId, email, role = 'viewer') => {
            set({ isLoading: true, error: null });
            try {                await boardApi.addCollaborator(boardId, email, role);
                // Refresh board data to show new collaborator
                const updatedBoard = await boardApi.getBoardById(boardId);
                set(() => ({
                    currentBoard: updatedBoard,
                    isLoading: false,
                }));
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : "Failed to add collaborator",
                    isLoading: false,
                });
                throw error;
            }
        },

        removeCollaborator: async (boardId, collaboratorId) => {
            set({ isLoading: true, error: null });
            try {                await boardApi.removeCollaborator(boardId, collaboratorId);
                // Refresh board data to remove collaborator
                const updatedBoard = await boardApi.getBoardById(boardId);
                set(() => ({
                    currentBoard: updatedBoard,
                    isLoading: false,
                }));
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : "Failed to remove collaborator",
                    isLoading: false,
                });
                throw error;
            }
        },

        generateShareableLink: async (boardId, makePublic = true) => {
            set({ isLoading: true, error: null });
            try {
                const result = await boardApi.generateShareableLink(boardId, makePublic);
                // Update current board if it's the one being shared
                set((state) => ({
                    currentBoard: state.currentBoard?.id === boardId 
                        ? { ...state.currentBoard, isPublic: result.isPublic }
                        : state.currentBoard,
                    isLoading: false,
                }));
                return result;
            } catch (error) {
                set({
                    error: error instanceof Error ? error.message : "Failed to generate shareable link",
                    isLoading: false,
                });
                throw error;
            }
        },

        // Canvas save/load operations
        saveCanvasContent: async (boardId, content, settings) => {
            set({ isLoading: true, error: null });
            try {
                const result = await boardApi.saveCanvasContent(
                    boardId,
                    content,
                    settings
                );
                set((state) => ({
                    currentBoard:
                        state.currentBoard?.id === boardId
                            ? result.board
                            : state.currentBoard,
                    isLoading: false,
                }));
            } catch (error) {
                set({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Failed to save canvas",
                    isLoading: false,
                });
                throw error;
            }
        },

        // State updates
        setCurrentBoard: (board) => set({ currentBoard: board }),

        setConnectedUsers: (users) => set({ connectedUsers: users }),

        addUser: (user) =>
            set((state) => ({
                connectedUsers: [
                    ...state.connectedUsers.filter((u) => u.id !== user.id),
                    user,
                ],
            })),

        removeUser: (userId) =>
            set((state) => ({
                connectedUsers: state.connectedUsers.filter(
                    (u) => u.id !== userId
                ),
            })),

        updateCanvasVersion: (version) => set({ canvasVersion: version }),

        setError: (error) => set({ error }),

        clearError: () => set({ error: null }),
    }))
);

// Setup socket event listeners
export const setupSocketListeners = () => {
    const store = useBoardStore.getState();

    // Board state updates
    socketService.on("board:state", (data) => {
        store.setConnectedUsers(data.users);
        store.updateCanvasVersion(data.version);
    });

    // User events
    socketService.on("user:joined", (data) => {
        store.addUser(data.user);
    });

    socketService.on("user:left", (data) => {
        store.removeUser(data.userId);
    });

    // Error handling
    socketService.on("error", (data) => {
        store.setError(data.message);
    });
};
