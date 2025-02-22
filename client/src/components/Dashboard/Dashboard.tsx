import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Search, 
  Grid3X3, 
  List, 
  Clock, 
  Users, 
  Palette,
  MoreHorizontal,
  Star,
  Share
} from 'lucide-react';

interface Board {
  id: string;
  title: string;
  thumbnail?: string;
  updatedAt: string;
  collaborators: number;
  isStarred: boolean;
  isOwner: boolean;
}

const mockBoards: Board[] = [
  {
    id: '1',
    title: 'Project Brainstorm',
    updatedAt: '2 hours ago',
    collaborators: 3,
    isStarred: true,
    isOwner: true,
  },
  {
    id: '2',
    title: 'UI Design System',
    updatedAt: '1 day ago',
    collaborators: 5,
    isStarred: false,
    isOwner: true,
  },
  {
    id: '3',
    title: 'Team Meeting Notes',
    updatedAt: '3 days ago',
    collaborators: 8,
    isStarred: true,
    isOwner: false,
  },
];

export const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterBy, setFilterBy] = useState<'all' | 'starred' | 'owned'>('all');

  const filteredBoards = mockBoards.filter(board => {
    const matchesSearch = board.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterBy === 'all' || 
      (filterBy === 'starred' && board.isStarred) ||
      (filterBy === 'owned' && board.isOwner);
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here are your recent whiteboards.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create New Board</h3>
                <p className="text-sm text-gray-600">Start a fresh whiteboard</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Join Room</h3>
                <p className="text-sm text-gray-600">Enter room code</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Palette className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Templates</h3>
                <p className="text-sm text-gray-600">Browse templates</p>
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Boards</option>
                <option value="starred">Starred</option>
                <option value="owned">Owned by me</option>
              </select>

              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Boards Grid/List */}
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' 
          : 'space-y-4'
        }>
          {filteredBoards.map((board) => (
            <motion.div
              key={board.id}
              whileHover={{ scale: 1.02 }}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer ${
                viewMode === 'list' ? 'flex items-center p-4' : 'p-4'
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  <div className="aspect-video bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg mb-4 flex items-center justify-center">
                    <Palette className="w-8 h-8 text-gray-400" />
                  </div>
                  
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 truncate flex-1">{board.title}</h3>
                    <div className="flex items-center gap-1 ml-2">
                      {board.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {board.updatedAt}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {board.collaborators}
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
                      <h3 className="font-semibold text-gray-900">{board.title}</h3>
                      {board.isStarred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {board.updatedAt}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {board.collaborators} collaborators
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <Share className="w-4 h-4 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>

        {filteredBoards.length === 0 && (
          <div className="text-center py-12">
            <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No boards found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? "Try adjusting your search or filters" 
                : "Create your first whiteboard to get started"
              }
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Create New Board
            </motion.button>
          </div>
        )}
      </div>
    </div>
  );
};
