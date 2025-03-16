import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '../components/Canvas/Canvas';
import { useBoardStore } from '../stores/boardStore';
import { useAuthStore } from '../stores/authStore';
import { socketService } from '../services/socketService';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { 
    currentBoard, 
    isLoading, 
    error, 
    fetchBoard, 
    joinBoard, 
    leaveBoard,
    connectedUsers 
  } = useBoardStore();
  useEffect(() => {
    if (!boardId || !user) {
      navigate('/dashboard');
      return;
    }

    // Get token from auth store or fallback to localStorage
    const authToken = token || localStorage.getItem('accessToken');
    
    if (!authToken) {
      console.error('No authentication token available');
      navigate('/dashboard');
      return;
    }

    console.log('BoardPage: Connecting with token:', authToken ? 'present' : 'missing');

    // Fetch board data
    fetchBoard(boardId);

    // Join board for real-time collaboration
    joinBoard(boardId);    // Connect to socket with authentication token
    if (!socketService.isConnected()) {
      socketService.connect(authToken);
    }    return () => {
      leaveBoard(boardId);
    };
  }, [boardId, user, token, navigate, fetchBoard, joinBoard, leaveBoard]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading board</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Board not found</h2>
          <p className="text-gray-600 mb-4">The board you're looking for doesn't exist or you don't have access to it.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-xl font-semibold text-gray-900">{currentBoard.title}</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Connected Users */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {connectedUsers.length} {connectedUsers.length === 1 ? 'user' : 'users'} connected
            </span>
            <div className="flex -space-x-2">
              {connectedUsers.slice(0, 5).map((connectedUser) => (
                <div
                  key={connectedUser.id}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                  style={{ backgroundColor: connectedUser.color }}
                  title={connectedUser.username}
                >
                  {connectedUser.username.charAt(0).toUpperCase()}
                </div>
              ))}
              {connectedUsers.length > 5 && (
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                  +{connectedUsers.length - 5}
                </div>
              )}
            </div>
          </div>

          {/* Share Button */}
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
            Share
          </button>
        </div>
      </header>

      {/* Canvas */}
      <main className="flex-1 overflow-hidden">
        <Canvas 
          boardId={boardId!} 
          width={window.innerWidth}
          height={window.innerHeight - 64} // Subtract header height
        />
      </main>
    </div>
  );
};
