
import React from 'react';
import { X } from 'lucide-react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      ></div>
      
      {/* Modal Content */}
      <div className="relative bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[85vh] animate-fade-in-up overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-xl sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-700/50 rounded-full transition-colors group"
          >
            <X className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
          </button>
        </div>
        
        {/* Scrollable Body */}
        <div className="p-8 overflow-y-auto custom-scrollbar text-slate-300 space-y-6 leading-relaxed">
          {content}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50 bg-slate-900/30 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
