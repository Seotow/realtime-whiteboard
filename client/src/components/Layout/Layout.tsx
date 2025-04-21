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
}

export const Layout: React.FC<LayoutProps> = ({ children, collaboration }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header collaboration={collaboration} />
      <main>{children}</main>
    </div>
  );
};
