import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Trash2, LogOut } from 'lucide-react';
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  type?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  type = 'danger',
  icon
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#1A2E35]/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-[340px] bg-white rounded-[2.5rem] p-8 shadow-2xl text-center"
          >
            <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${
              type === 'danger' ? 'bg-danger-red/10 text-danger-red' : 'bg-teal-primary/10 text-teal-primary'
            }`}>
              {icon || (type === 'danger' ? <Trash2 className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />)}
            </div>
            
            <h3 className="text-xl font-black text-[#1A2E35] mb-2">{title}</h3>
            <p className="text-sm font-medium text-[#6B8F8A] mb-8 leading-relaxed whitespace-pre-line">
              {message}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${
                  type === 'danger' 
                    ? 'bg-danger-red text-white shadow-lg shadow-danger-red/20' 
                    : 'bg-teal-primary text-white shadow-lg shadow-teal-primary/20'
                }`}
              >
                {confirmLabel}
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 text-[#8A9BA8] text-sm font-black uppercase tracking-widest hover:text-[#1A2E35] transition-colors"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
