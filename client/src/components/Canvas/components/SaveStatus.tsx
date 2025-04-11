import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle, Save } from "lucide-react";

interface SaveStatusProps {
    isSaving: boolean;
    lastSaveTime: Date | null;
    className?: string;
}

export const SaveStatus: React.FC<SaveStatusProps> = ({
    isSaving,
    lastSaveTime,
    className = "",
}) => {
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
    
    // Show success animation when save completes
    useEffect(() => {
        if (!isSaving && lastSaveTime) {
            setShowSuccessAnimation(true);
            const timer = setTimeout(() => setShowSuccessAnimation(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [isSaving, lastSaveTime]);

    const formatSaveTime = (date: Date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        
        if (diffInSeconds < 10) {
            return "saved just now";
        } else if (diffInSeconds < 60) {
            return `saved ${diffInSeconds}s ago`;
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `saved ${minutes}m ago`;
        } else {
            return `saved at ${date.toLocaleTimeString()}`;
        }
    };

    return (
        <div className={`save-status flex items-center gap-2 text-sm transition-all duration-300 ${className}`}>
            {isSaving ? (
                <>
                    <Loader2 size={16} className="animate-spin text-blue-500" />
                    <span className="text-blue-600 font-medium">Saving...</span>
                </>
            ) : lastSaveTime ? (
                <>
                    <CheckCircle 
                        size={16} 
                        className={`transition-all duration-300 ${
                            showSuccessAnimation 
                                ? 'text-green-500 scale-110' 
                                : 'text-green-500'
                        }`} 
                    />
                    <span 
                        className={`transition-all duration-300 ${
                            showSuccessAnimation 
                                ? 'text-green-600 font-medium' 
                                : 'text-gray-600'
                        }`}
                    >
                        {formatSaveTime(lastSaveTime)}
                    </span>
                </>
            ) : (
                <>
                    <Save size={16} className="text-gray-400" />
                    <span className="text-gray-500">Auto-save ready</span>
                </>
            )}
        </div>
    );
};
