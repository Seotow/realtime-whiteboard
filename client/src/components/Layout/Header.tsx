import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PenTool, 
  User, 
  LogOut, 
  Settings, 
  Menu,
  X,
  Home,
  Palette,
  Users,
  Share,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import type { BoardUser } from '../../services/socketService';

interface CollaborationInfo {
  connectedUsers: BoardUser[];
  isConnected: boolean;
  onShare?: () => void;
}

interface HeaderProps {
  collaboration?: CollaborationInfo;
  boardName?: string;
}

export const Header: React.FC<HeaderProps> = ({ collaboration, boardName }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">          {/* Logo and Brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <PenTool className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Whiteboard</span>
            </div>

            {/* Board Name Display (when on a board page) */}
            {boardName && (
              <div className="hidden sm:flex items-center">
                <div className="w-px h-6 bg-gray-300 mx-3" />
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-900 font-medium max-w-[200px] truncate" title={boardName}>
                    {boardName}
                  </span>
                </div>
              </div>
            )}            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6 ml-8">
              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </button>
            </nav>
          </div>          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Collaboration Section (only on board pages) */}
            {collaboration && (
              <>
                {/* Connection Status */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100">
                  {collaboration.isConnected ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm text-gray-600">
                    {collaboration.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                {/* Connected Users */}
                <div className="hidden sm:flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {collaboration.connectedUsers.length} online
                  </span>
                  
                  {/* User Avatars */}
                  <div className="flex -space-x-1">
                    {collaboration.connectedUsers.slice(0, 3).map((user) => (
                      <div 
                        key={user.id}
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                        style={{ backgroundColor: user.color }}
                        title={user.username}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {collaboration.connectedUsers.length > 3 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs text-white font-medium">
                        +{collaboration.connectedUsers.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                {/* Share Button */}
                {collaboration.onShare && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={collaboration.onShare}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    <Share className="w-4 h-4" />
                    <span className="hidden sm:inline">Share</span>
                  </motion.button>
                )}              </>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-medium text-sm">
                      {user?.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
              </button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                      <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    
                    <button 
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button 
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 py-4"
            >
              {/* Mobile Board Name */}
              {boardName && (
                <div className="px-4 py-2 mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Palette className="w-4 h-4" />
                    <span className="font-medium">{boardName}</span>
                  </div>
                </div>
              )}

              <nav className="space-y-2">
                <button 
                  onClick={() => {
                    navigate('/dashboard');
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left flex items-center gap-3 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">                  <Home className="w-4 h-4" />
                  Dashboard
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
