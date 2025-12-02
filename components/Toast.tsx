import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const bgColors = {
    success: 'bg-green-500/10 border-green-500/20 text-green-400',
    error: 'bg-red-500/10 border-red-500/20 text-red-400',
    info: 'bg-blue-500/10 border-blue-500/20 text-blue-400'
  };

  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  return (
    <div className="fixed top-24 right-4 md:right-8 z-[100] animate-slide-in">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${bgColors[type]} min-w-[300px] max-w-md`}>
        <div className="shrink-0">{icons[type]}</div>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button 
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-4 h-4 opacity-70" />
        </button>
      </div>
    </div>
  );
};
