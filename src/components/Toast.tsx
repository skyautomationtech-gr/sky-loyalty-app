import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import React, { useEffect } from 'react';

interface ToastProps {
  show: boolean;
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ show, message, type = 'success', onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, onClose, duration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[300] w-[calc(100%-48px)] max-w-[380px]"
        >
          <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${
            type === 'success' 
              ? 'bg-white border-teal-primary/20 text-dark-text' 
              : 'bg-white border-danger-red/20 text-dark-text'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              type === 'success' ? 'bg-teal-primary/10 text-teal-primary' : 'bg-danger-red/10 text-danger-red'
            }`}>
              {type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-gray-text mb-0.5">
                {type === 'success' ? 'সফল হয়েছে' : 'ত্রুটি'}
              </p>
              <p className="text-sm font-bold truncate">{message}</p>
            </div>

            <button 
              onClick={onClose}
              className="p-2 hover:bg-bg-light rounded-lg transition-colors text-gray-text"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
