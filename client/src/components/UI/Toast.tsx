import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message?: string;
  onClose: () => void;
}

const toastIcons = {
  success: CheckCircle,
  info: Clock,
  warning: AlertCircle,
  error: XCircle,
};

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
};

const iconStyles = {
  success: 'text-green-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};

export const Toast: React.FC<ToastProps> = ({ type, title, message, onClose }) => {
  const Icon = toastIcons[type];

  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      className={`max-w-sm w-full shadow-lg rounded-lg border pointer-events-auto ${toastStyles[type]}`}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Icon className={`h-5 w-5 ${iconStyles[type]}`} />
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium">{title}</p>
            {message && <p className="mt-1 text-sm opacity-90">{message}</p>}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={onClose}
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
