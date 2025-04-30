import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '../components/Canvas/Canvas';
import { Layout } from '../components/Layout/Layout';
import { ShareModal } from '../components/Canvas/components/ShareModal';
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
  
  const [showShareModal, setShowShareModal] = useState(false);  useEffect(() => {
    if (!boardId) {
      navigate('/dashboard');
      return;
    }

    // Get token from auth store or fallback to localStorage
    const authToken = token || localStorage.getItem('accessToken');
    
    // For public boards, allow access without authentication
    // Try to fetch the board first to check if it's public
    console.log('BoardPage: Accessing board:', boardId);
    console.log('BoardPage: User:', user ? 'authenticated' : 'anonymous');
    console.log('BoardPage: Token:', authToken ? 'present' : 'missing');

    // Fetch board data (this will work for public boards even without auth)
    fetchBoard(boardId);

    // Join board for real-time collaboration
    joinBoard(boardId);    // Connect to socket with authentication token (if available)
    if (!socketService.isConnected()) {
      if (authToken) {
        socketService.connect(authToken);
      } else {
        // For public boards, connect without authentication
        console.log('BoardPage: Connecting without authentication for public board access');
        socketService.connect();
      }
    }return () => {
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
  }  return (
    <Layout
      collaboration={{
        connectedUsers,
        isConnected: socketService.isConnected(),
        onShare: () => setShowShareModal(true)
      }}
      boardName={currentBoard.title}
    >
      <div className="h-screen overflow-hidden">
        <Canvas 
          boardId={boardId!} 
          width={window.innerWidth}
          height={window.innerHeight - 64} // Subtract header height
        />
        
        {/* Share Modal */}
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          boardId={boardId!}
        />
      </div>
    </Layout>
  );
};
