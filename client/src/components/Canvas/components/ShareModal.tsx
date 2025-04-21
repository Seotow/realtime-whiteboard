import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Copy,
    Check,
    Users,
    Globe,
    Lock,
    UserPlus,
    Mail,
    Trash2,
    Crown,
    Eye,
    Edit3,
    Shield
} from 'lucide-react';
import { useBoardStore } from '../../../stores/boardStore';
import { useAuthStore } from '../../../stores/authStore';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    boardId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, boardId }) => {
    const { currentBoard, generateShareableLink, addCollaborator, removeCollaborator } = useBoardStore();
    const { user } = useAuthStore();
    
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
    const [newCollaboratorRole, setNewCollaboratorRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
    const [isAddingCollaborator, setIsAddingCollaborator] = useState(false);
    const [showAddCollaborator, setShowAddCollaborator] = useState(false);

    useEffect(() => {
        if (isOpen && currentBoard && boardId === currentBoard.id) {
            setIsPublic(currentBoard.isPublic);
            setShareUrl(`${window.location.origin}/board/${boardId}`);
        }
    }, [isOpen, currentBoard, boardId]);

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
        }
    };

    const handleTogglePublic = async () => {
        try {
            const result = await generateShareableLink(boardId, !isPublic);
            setIsPublic(result.isPublic);
            setShareUrl(result.shareUrl);
        } catch (error) {
            console.error('Failed to toggle public access:', error);
        }
    };

    const handleAddCollaborator = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCollaboratorEmail.trim()) return;

        setIsAddingCollaborator(true);
        try {
            await addCollaborator(boardId, newCollaboratorEmail.trim(), newCollaboratorRole);
            setNewCollaboratorEmail('');
            setShowAddCollaborator(false);
        } catch (error) {
            console.error('Failed to add collaborator:', error);
        } finally {
            setIsAddingCollaborator(false);
        }
    };

    const handleRemoveCollaborator = async (collaboratorId: string) => {
        try {
            await removeCollaborator(boardId, collaboratorId);
        } catch (error) {
            console.error('Failed to remove collaborator:', error);
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Crown className="w-4 h-4 text-yellow-500" />;
            case 'editor':
                return <Edit3 className="w-4 h-4 text-blue-500" />;
            case 'viewer':
                return <Eye className="w-4 h-4 text-gray-500" />;
            default:
                return <Shield className="w-4 h-4 text-gray-400" />;
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Admin';
            case 'editor':
                return 'Editor';
            case 'viewer':
                return 'Viewer';
            default:
                return 'Unknown';
        }
    };

    const isOwner = currentBoard?.userId === user?.id;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">Share Board</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Public Access Toggle */}
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {isPublic ? (
                                    <Globe className="w-5 h-5 text-green-500" />
                                ) : (
                                    <Lock className="w-5 h-5 text-gray-500" />
                                )}
                                <span className="font-medium text-gray-900">
                                    {isPublic ? 'Public Access' : 'Private Board'}
                                </span>
                            </div>
                            {isOwner && (
                                <button
                                    onClick={handleTogglePublic}
                                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                        isPublic
                                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    }`}
                                >
                                    {isPublic ? 'Public' : 'Private'}
                                </button>
                            )}
                        </div>
                        <p className="text-sm text-gray-600">
                            {isPublic
                                ? 'Anyone with the link can view this board'
                                : 'Only invited collaborators can access this board'}
                        </p>
                    </div>

                    {/* Share Link */}
                    {isPublic && (
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Share Link
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={shareUrl}
                                    readOnly
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:outline-none"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-4 h-4" />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Collaborators Section */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Collaborators</h3>
                            </div>
                            {isOwner && (
                                <button
                                    onClick={() => setShowAddCollaborator(!showAddCollaborator)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Add
                                </button>
                            )}
                        </div>

                        {/* Add Collaborator Form */}
                        {showAddCollaborator && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleAddCollaborator}
                                className="mb-4 p-4 bg-blue-50 rounded-lg"
                            >
                                <div className="flex items-center gap-2 mb-3">
                                    <Mail className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">Add New Collaborator</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={newCollaboratorEmail}
                                        onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                    <select
                                        value={newCollaboratorRole}
                                        onChange={(e) => setNewCollaboratorRole(e.target.value as 'viewer' | 'editor' | 'admin')}
                                        className="px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="viewer">Viewer</option>
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button
                                        type="submit"
                                        disabled={isAddingCollaborator}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                    >
                                        {isAddingCollaborator ? 'Adding...' : 'Add'}
                                    </button>
                                </div>
                            </motion.form>
                        )}

                        {/* Collaborators List */}
                        <div className="space-y-2">
                            {/* Owner */}
                            {currentBoard?.user && (
                                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                            {currentBoard.user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{currentBoard.user.username}</p>
                                            <p className="text-sm text-gray-600">{currentBoard.user.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Crown className="w-4 h-4 text-yellow-500" />
                                        <span className="text-sm font-medium text-yellow-700">Owner</span>
                                    </div>
                                </div>
                            )}

                            {/* Collaborators */}
                            {currentBoard?.collaborators.map((collaborator) => (
                                <div key={collaborator.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                            {collaborator.userId.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">User {collaborator.userId}</p>
                                            <p className="text-sm text-gray-600">Added {new Date(collaborator.addedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {getRoleIcon(collaborator.role)}
                                        <span className="text-sm font-medium text-gray-700">{getRoleLabel(collaborator.role)}</span>
                                        {isOwner && (
                                            <button
                                                onClick={() => handleRemoveCollaborator(collaborator.userId)}
                                                className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {(!currentBoard?.collaborators || currentBoard.collaborators.length === 0) && (
                                <div className="text-center py-6 text-gray-500">
                                    <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                    <p>No collaborators yet</p>
                                    <p className="text-sm">Invite others to collaborate on this board</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
