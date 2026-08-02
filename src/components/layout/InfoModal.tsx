import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Language, translations } from '../../i18n';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  language?: Language;
}

export default function InfoModal({
  isOpen,
  onClose,
  title,
  message,
  language = 'en'
}: InfoModalProps) {
  const t = translations[language];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="info-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            key="info-modal-content"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-white/20"
          >
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                  <Info size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">{title}</h2>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">System Information</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line font-medium">
                {message}
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-gray-900/20 hover:bg-gray-800 transition-all"
              >
                {t.complete || 'Close'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
