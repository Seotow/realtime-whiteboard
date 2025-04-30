import React from 'react';
import { Header } from './Header';
import type { BoardUser } from '../../services/socketService';

interface CollaborationInfo {
  connectedUsers: BoardUser[];
  isConnected: boolean;
  onShare?: () => void;
}

interface LayoutProps {
  children: React.ReactNode;
  collaboration?: CollaborationInfo;
  boardName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, collaboration, boardName }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header collaboration={collaboration} boardName={boardName} />
      <main>{children}</main>
    </div>
  );
};
