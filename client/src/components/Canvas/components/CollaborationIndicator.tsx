import React from 'react';
import { Users, Wifi, WifiOff } from 'lucide-react';
import type { BoardUser } from '../../../services/socketService';

interface CollaborationIndicatorProps {
    connectedUsers: BoardUser[];
    isConnected: boolean;
    className?: string;
}

export const CollaborationIndicator: React.FC<CollaborationIndicatorProps> = ({
    connectedUsers,
    isConnected,
    className = '',
}) => {
    const userCount = connectedUsers.length;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Connection Status */}
            <div className="flex items-center gap-1">
                {isConnected ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>

            {/* User Count */}
            {userCount > 0 && (
                <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600">
                        {userCount} user{userCount !== 1 ? 's' : ''}
                    </span>
                </div>
            )}

            {/* User Avatars */}
            {userCount > 0 && (
                <div className="flex -space-x-2">
                    {connectedUsers.slice(0, 5).map((user) => (
                        <div
                            key={user.id}
                            className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-xs font-semibold text-white shadow-sm"
                            style={{ backgroundColor: user.color }}
                            title={`${user.username} (${user.isActive ? 'active' : 'inactive'})`}
                        >
                            {user.username.charAt(0).toUpperCase()}
                        </div>
                    ))}
                    {userCount > 5 && (
                        <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-500 flex items-center justify-center text-xs font-semibold text-white shadow-sm">
                            +{userCount - 5}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
