import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Language, translations } from '../../i18n';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  language?: Language;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  type = 'warning',
  language = 'en'
}: ConfirmModalProps) {
  const t = translations[language];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border border-white/20"
          >
            <div className="p-8 text-center space-y-6">
              <div className={cn(
                "w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto",
                type === 'danger' ? "bg-red-50 text-red-500" :
                type === 'warning' ? "bg-amber-50 text-amber-500" :
                "bg-blue-50 text-blue-500"
              )}>
                <AlertTriangle size={40} />
              </div>
              
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">{title}</h3>
                <p className="text-xs text-gray-500 font-medium mt-2 leading-relaxed">
                  {message}
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  {cancelText || t.cancel}
                </button>
                <button 
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={cn(
                    "flex-1 py-4 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl",
                    type === 'danger' ? "bg-red-500 shadow-red-500/20 hover:bg-red-600" :
                    type === 'warning' ? "bg-amber-500 shadow-amber-500/20 hover:bg-amber-600" :
                    "bg-blue-500 shadow-blue-500/20 hover:bg-blue-600"
                  )}
                >
                  {confirmText || t.confirm}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
