import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Search,
    Grid3X3,
    List,
    Clock,
    Users,
    Palette,
    MoreHorizontal,
    Share,
    Trash2,
    Copy,
    Settings,
    X,
    Link,
} from "lucide-react";
import { useBoardStore } from "../../stores/boardStore";
import type { Board } from "../../services/boardApi";
import { useAuthStore } from "../../stores/authStore";
import { LoadingSpinner } from "../UI/LoadingSpinner";
import { BoardSettingsModal } from "./BoardSettingsModal";

interface CreateBoardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateBoard: (data: {
        title: string;
        description: string;
        isPublic: boolean;
    }) => void;
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
    isOpen,
    onClose,
    onCreateBoard,
}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setIsCreating(true);
        try {
            await onCreateBoard({
                title: title.trim(),
                description: description.trim(),
                isPublic,
            });

            // Only reset and close if successful
            setTitle("");
            setDescription("");
            setIsPublic(false);
            onClose();
        } catch (error) {
            console.error("Failed to create board:", error);
            // Don't close modal on error - let user try again
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={onClose}>
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-lg p-6 w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Create New Board
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label
                                    htmlFor="title"
                                    className="block text-sm font-medium text-gray-700 mb-1">
                                    Board Title
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter board title..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="description"
                                    className="block text-sm font-medium text-gray-700 mb-1">
                                    Description (Optional)
                                </label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }
                                    placeholder="Describe your board..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isPublic"
                                    checked={isPublic}
                                    onChange={(e) =>
                                        setIsPublic(e.target.checked)
                                    }
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label
                                    htmlFor="isPublic"
                                    className="ml-2 block text-sm text-gray-700">
                                    Make this board public
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!title.trim() || isCreating}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                                {isCreating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Board"
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

interface JoinRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onJoinRoom: (roomCode: string) => void;
}

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
    isOpen,
    onClose,
    onJoinRoom,
}) => {
    const [roomCode, setRoomCode] = useState("");
    const [isJoining, setIsJoining] = useState(false);    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomCode.trim()) return;

        setIsJoining(true);
        try {
            // Extract board ID from either a full URL or just the ID
            let boardId = roomCode.trim();
            
            // Check if it's a full URL
            if (boardId.includes('/board/')) {
                const match = boardId.match(/\/board\/([^/?]+)/);
                if (match) {
                    boardId = match[1];
                }
            }
            
            onJoinRoom(boardId);
            setRoomCode("");
            onClose();
        } catch (error) {
            console.error("Failed to join room:", error);
        } finally {
            setIsJoining(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={onClose}>
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-lg p-6 w-full max-w-md"
                    onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Join Room
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">                            <div>
                                <label
                                    htmlFor="roomCode"
                                    className="block text-sm font-medium text-gray-700 mb-1">
                                    Room Code or Link
                                </label>
                                <input
                                    type="text"
                                    id="roomCode"
                                    value={roomCode}
                                    onChange={(e) =>
                                        setRoomCode(e.target.value)
                                    }
                                    placeholder="Enter board ID or paste full URL..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    You can enter a board ID (e.g., "abc123") or paste the full URL (e.g., "https://example.com/board/abc123").
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!roomCode.trim() || isJoining}
                                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                                {isJoining ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Joining...
                                    </>
                                ) : (
                                    "Join Room"
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, _hasHydrated } = useAuthStore();    const {
        boards,
        accessedBoards,
        isLoading,
        fetchBoards,
        fetchAccessedBoards,
        createBoard,
        deleteBoard,
        updateBoard,
    } = useBoardStore();const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filterBy, setFilterBy] = useState<"all" | "owned" | "shared">("all");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [selectedBoard, setSelectedBoard] = useState<string | null>(null);
    const [settingsBoard, setSettingsBoard] = useState<Board | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    useEffect(() => {
        if (_hasHydrated && !user) {
            navigate("/auth");
        }
    }, [user, _hasHydrated, navigate]);    useEffect(() => {
        if (user) {
            fetchBoards();
            fetchAccessedBoards();
        }
    }, [user, fetchBoards, fetchAccessedBoards]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setSelectedBoard(null);
        };

        if (selectedBoard) {
            document.addEventListener("click", handleClickOutside);
            return () =>
                document.removeEventListener("click", handleClickOutside);
        }
    }, [selectedBoard]);
    const handleCreateBoard = async (data: {
        title: string;
        description: string;
        isPublic: boolean;
    }) => {
        if (!user) {
            console.error("No user found for board creation");
            return;
        }

        try {
            const newBoard = await createBoard(data);

            if (newBoard) {
                navigate(`/board/${newBoard.id}`);
            } else {
                console.error("Board creation returned null/undefined");
            }
        } catch (error) {
            console.error("Failed to create board:", error);
            // TODO: Show error toast to user
        }
    };

    const handleDeleteBoard = async (boardId: string) => {
        if (
            !window.confirm(
                "Are you sure you want to delete this board? This action cannot be undone."
            )
        ) {
            return;
        }

        try {
            await deleteBoard(boardId);
            // Refresh the boards list
            fetchBoards();
        } catch (error) {
            console.error("Failed to delete board:", error);
        }
    };
    const handleShareBoard = async (boardId: string) => {
        try {
            // Get the board first to check if it's already public
            const board = boards.find((b) => b.id === boardId);

            let shareUrl;
            if (board?.isPublic) {
                // Already public, just copy the link
                shareUrl = `${window.location.origin}/board/${boardId}`;
            } else {
                // Make it public first
                await updateBoard(boardId, { isPublic: true });
                shareUrl = `${window.location.origin}/board/${boardId}`;
                // Refresh boards to update the UI
                fetchBoards();
            }

            await navigator.clipboard.writeText(shareUrl);
            setToastMessage(
                "Board link copied to clipboard! Anyone with this link can now view the board."
            );
            setTimeout(() => setToastMessage(null), 4000);
        } catch (error) {
            console.error("Failed to share board:", error);
            // Fallback: still generate and show the URL
            const shareUrl = `${window.location.origin}/board/${boardId}`;
            try {
                await navigator.clipboard.writeText(shareUrl);
                setToastMessage(
                    "Board link copied! Note: You may need to make the board public in settings."
                );
                setTimeout(() => setToastMessage(null), 4000);
            } catch {
                // Final fallback: show the URL in a prompt
                prompt("Copy this link to share the board:", shareUrl);
            }
        }
    };
    const handleDuplicateBoard = async (board: {
        id: string;
        title: string;
        description?: string;
    }) => {
        try {
            const newBoard = await createBoard({
                title: `${board.title} (Copy)`,
                description: board.description || "",
                isPublic: false,
            });

            if (newBoard) {
                // Refresh the boards list to show the new board
                fetchBoards();
            }
        } catch (error) {
            console.error("Failed to duplicate board:", error);
        }
    };
    const handleJoinRoom = () => {
        setIsJoinModalOpen(true);
    };

    const handleJoinRoomSubmit = (roomCode: string) => {
        navigate(`/board/${roomCode}`);
    };    const handleBoardClick = (boardId: string) => {
        // Don't navigate if a dropdown is open
        if (selectedBoard) return;
        navigate(`/board/${boardId}`);
    };const filteredBoards = (() => {
        let allBoards = boards;
        
        // For "all" filter, combine owned/collaborator boards with accessed boards
        if (filterBy === "all") {
            // Create a Set of existing board IDs to avoid duplicates
            const existingBoardIds = new Set(boards.map(board => board.id));
            
            // Add accessed boards that aren't already in the main boards list
            // These are already sorted by most recent access from the backend
            const uniqueAccessedBoards = accessedBoards.filter(board => !existingBoardIds.has(board.id));
            
            // Put accessed boards first (most recent access), then owned/collaborator boards
            allBoards = [...uniqueAccessedBoards, ...boards];
        }
        
        return allBoards.filter((board) => {
            const matchesSearch = board.title
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesFilter =
                filterBy === "all" ||
                (filterBy === "owned" && board.userId === user?.id) ||
                (filterBy === "shared" && board.userId !== user?.id);

            return matchesSearch && matchesFilter;
        });
    })();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="large" />
            </div>
        );
    }    return (
        <div className="min-h-screen bg-gray-50" style={{ overflow: 'visible' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ overflow: 'visible' }}>
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Welcome back! Here are your recent whiteboards.
                    </p>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {" "}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setIsCreateModalOpen(true)}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Plus className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    Create New Board
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Start a fresh whiteboard
                                </p>
                            </div>
                        </div>
                    </motion.div>{" "}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={handleJoinRoom}>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    Join Room
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Enter room code
                                </p>
                            </div>
                        </div>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Palette className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    Templates
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Browse templates
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search boards..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">                            <select
                                value={filterBy}
                                onChange={(e) =>
                                    setFilterBy(
                                        e.target.value as "all" | "owned" | "shared"
                                    )
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="all">All Boards</option>
                                <option value="owned">Owned by Me</option>
                                <option value="shared">Shared with Me</option>
                            </select>

                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 rounded ${
                                        viewMode === "grid"
                                            ? "bg-white shadow-sm"
                                            : ""
                                    }`}>
                                    <Grid3X3 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 rounded ${
                                        viewMode === "list"
                                            ? "bg-white shadow-sm"
                                            : ""
                                    }`}>
                                    <List className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>                {/* Boards Grid/List */}
                <div
                    className={
                        viewMode === "grid"
                            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                            : "space-y-4"
                    }
                    style={{
                        // Ensure dropdowns aren't clipped by container
                        overflow: 'visible'
                    }}>                    {filteredBoards.map((board) => (
                        <motion.div
                            key={board.id}
                            whileHover={{ scale: 1.02 }}                            className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
                                selectedBoard === board.id ? 'cursor-default' : 'cursor-pointer'
                            } ${
                                viewMode === "list"
                                    ? "flex items-center p-4"
                                    : "p-4"
                            }`}style={{
                                position: 'relative',
                                zIndex: selectedBoard === board.id ? 65 : 'auto',
                                transition: 'z-index 0.1s ease'
                            }}
                            onClick={() => handleBoardClick(board.id)}>
                            {viewMode === "grid" ? (
                                <>
                                    <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                                        {board.content ? (
                                            <div className="text-xs text-gray-500 absolute top-2 right-2 bg-white/80 px-2 py-1 rounded">
                                                Has content
                                            </div>
                                        ) : null}                                        <Palette className="w-8 h-8 text-gray-400" />                                        {board.isPublic && (
                                            <div className="absolute bottom-2 left-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                                                Public
                                            </div>
                                        )}
                                        {/* Show "Recently Accessed" badge for boards from accessedBoards that aren't owned/collaborated */}
                                        {filterBy === "all" && 
                                         accessedBoards.some(ab => ab.id === board.id) && 
                                         board.userId !== user?.id && 
                                         !board.collaborators?.some(c => c.userId === user?.id) && (
                                            <div className="absolute bottom-2 right-2 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
                                                Recently Accessed
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900 truncate flex-1">
                                            {board.title}
                                        </h3>{" "}
                                        <div className="flex items-center gap-1 ml-2">
                                            <div className="relative">                                                <button
                                                    className="p-1 hover:bg-gray-100 rounded"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedBoard(
                                                            selectedBoard ===
                                                                board.id
                                                                ? null
                                                                : board.id
                                                        );
                                                    }}>
                                                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                                </button>

                                                {/* Dropdown Menu */}
                                                {selectedBoard === board.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-[70]" onClick={() => setSelectedBoard(null)} />                                                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[75] min-w-[160px]">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleShareBoard(
                                                                        board.id
                                                                    );
                                                                    setSelectedBoard(
                                                                        null
                                                                    );
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                                                <Link className="w-3 h-3" />
                                                                Share Board
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDuplicateBoard(
                                                                        board
                                                                    );
                                                                    setSelectedBoard(
                                                                        null
                                                                    );
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                                                <Copy className="w-3 h-3" />
                                                                Duplicate
                                                            </button>                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSettingsBoard(board);
                                                                setSelectedBoard(null);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                                            <Settings className="w-3 h-3" />
                                                            Settings
                                                        </button>
                                                        {board.userId ===
                                                            user?.id && (
                                                            <button
                                                                onClick={(
                                                                    e
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteBoard(
                                                                        board.id
                                                                    );
                                                                    setSelectedBoard(
                                                                        null
                                                                    );
                                                                }}
                                                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2">
                                                                <Trash2 className="w-3 h-3" />
                                                                Delete                                                            </button>
                                                        )}
                                                    </div>
                                                </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-gray-600">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {new Date(
                                                board.updatedAt
                                            ).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            {board.collaborators?.length || 0}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="w-16 h-12 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg flex items-center justify-center mr-4">
                                        <Palette className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">
                                                {board.title}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(
                                                    board.updatedAt
                                                ).toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                {board.collaborators?.length ||
                                                    0}{" "}                                                collaborators
                                            </div>
                                        </div>
                                    </div>{" "}
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <button
                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleShareBoard(board.id);
                                                }}>
                                                <Share className="w-4 h-4 text-gray-400" />
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <button
                                                className="p-2 hover:bg-gray-100 rounded-lg"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedBoard(
                                                        selectedBoard ===
                                                            board.id
                                                            ? null
                                                            : board.id
                                                    );
                                                }}>
                                                <MoreHorizontal className="w-4 h-4 text-gray-400" />
                                            </button>                                            {/* Dropdown Menu */}
                                            {selectedBoard === board.id && (
                                                <>
                                                    <div className="fixed inset-0 z-[70]" onClick={() => setSelectedBoard(null)} />                                                        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[75] min-w-[160px]">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleShareBoard(board.id);
                                                                setSelectedBoard(null);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                                            <Link className="w-3 h-3" />
                                                            Share Board
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDuplicateBoard(board);
                                                                setSelectedBoard(null);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                                            <Copy className="w-3 h-3" />
                                                            Duplicate
                                                        </button>
                                                        <button                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSettingsBoard(board);
                                                                setSelectedBoard(null);
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2">
                                                            <Settings className="w-3 h-3" />
                                                            Settings
                                                        </button>
                                                    {board.userId ===
                                                        user?.id && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteBoard(
                                                                    board.id
                                                                );
                                                                setSelectedBoard(
                                                                    null
                                                                );
                                                            }}
                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center gap-2">
                                                            <Trash2 className="w-3 h-3" />
                                                            Delete                                                        </button>
                                                    )}
                                                </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))}
                </div>

                {filteredBoards.length === 0 && (
                    <div className="text-center py-12">
                        <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No boards found
                        </h3>
                        <p className="text-gray-600 mb-4">
                            {searchQuery
                                ? "Try adjusting your search or filters"
                                : "Create your first whiteboard to get started"}
                        </p>{" "}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            Create New Board
                        </motion.button>
                    </div>
                )}
            </div>
            {/* Create Board Modal */}{" "}
            <CreateBoardModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreateBoard={handleCreateBoard}
            />            <JoinRoomModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                onJoinRoom={handleJoinRoomSubmit}
            />            <BoardSettingsModal
                isOpen={!!settingsBoard}
                onClose={() => setSettingsBoard(null)}
                board={settingsBoard}
                onUpdateBoard={async (boardId, updates) => {
                    await updateBoard(boardId, updates);
                    await fetchBoards(); // Refresh the boards list
                }}
            />
            {/* Simple Toast Notification */}
            {toastMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    {toastMessage}
                </motion.div>
            )}
        </div>
    );
};
