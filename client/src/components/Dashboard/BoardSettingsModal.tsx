import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Globe, Lock, Save } from 'lucide-react';
import type { Board } from '../../services/boardApi';

interface BoardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
  onUpdateBoard: (boardId: string, updates: { title: string; description?: string; isPublic: boolean }) => Promise<void>;
}

export const BoardSettingsModal: React.FC<BoardSettingsModalProps> = ({
  isOpen,
  onClose,
  board,
  onUpdateBoard,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !board) return;

    setIsSaving(true);
    try {
      await onUpdateBoard(board.id, {
        title: title.trim(),
        description: description.trim(),
        isPublic,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update board:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form when modal opens or board changes
  React.useEffect(() => {
    if (isOpen && board) {
      setTitle(board.title);
      setDescription(board.description || '');
      setIsPublic(board.isPublic);
    }
  }, [isOpen, board]);

  if (!isOpen || !board) return null;

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
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Board Settings
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Board Title */}
              <div>
                <label
                  htmlFor="boardTitle"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Board Title
                </label>
                <input
                  type="text"
                  id="boardTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter board title..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>

              {/* Board Description */}
              <div>
                <label
                  htmlFor="boardDescription"
                  className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  id="boardDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your board..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Privacy Setting */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Privacy
                </label>
                <div className="space-y-2">
                  <div 
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      isPublic ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => setIsPublic(true)}>
                    <input
                      type="radio"
                      id="public"
                      checked={isPublic}
                      onChange={() => setIsPublic(true)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-green-600" />
                        <label htmlFor="public" className="font-medium text-gray-900 cursor-pointer">
                          Public
                        </label>
                      </div>
                      <p className="text-sm text-gray-600">
                        Anyone can view and collaborate on this board
                      </p>
                    </div>
                  </div>

                  <div 
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      !isPublic ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                    onClick={() => setIsPublic(false)}>
                    <input
                      type="radio"
                      id="private"
                      checked={!isPublic}
                      onChange={() => setIsPublic(false)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-gray-600" />
                        <label htmlFor="private" className="font-medium text-gray-900 cursor-pointer">
                          Private
                        </label>
                      </div>
                      <p className="text-sm text-gray-600">
                        Only you can access this board
                      </p>
                    </div>
                  </div>
                </div>
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
                disabled={!title.trim() || isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2">
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
