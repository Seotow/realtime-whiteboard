import React, { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

interface SaveToastProps {
    show: boolean;
    onHide: () => void;
    message?: string;
}

export const SaveToast: React.FC<SaveToastProps> = ({
    show,
    onHide,
    message = "Canvas saved successfully"
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (show) {
            setIsVisible(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setTimeout(onHide, 300); // Wait for animation to complete
            }, 3000);
            
            return () => clearTimeout(timer);
        }
    }, [show, onHide]);

    if (!show && !isVisible) return null;

    return (
        <div 
            className={`fixed top-20 right-4 bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 z-[100] max-w-sm transition-all duration-300 ${
                isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
            }`}
        >
            <div className="flex items-center gap-3">
                <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">{message}</p>
                    <p className="text-xs text-green-600 mt-1">Changes synchronized</p>
                </div>
                <button
                    onClick={() => {
                        setIsVisible(false);
                        setTimeout(onHide, 300);
                    }}
                    className="text-green-400 hover:text-green-600 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};
