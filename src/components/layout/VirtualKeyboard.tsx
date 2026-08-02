
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { X, Delete, Space, CornerDownLeft, Globe, Keyboard as KeyboardIcon, ArrowUp, GripHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

interface VirtualKeyboardProps {
  isOpen: boolean;
  onClose: () => void;
  onInput: (char: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  language: 'en' | 'si';
  onLanguageToggle: () => void;
}

const EN_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '@']
];

const SI_LAYOUT = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['ක', 'ඛ', 'ග', 'ඝ', 'ඞ', 'ඟ', 'ච', 'ඡ', 'ජ', 'ඣ'],
  ['ට', 'ඨ', 'ඩ', 'ඪ', 'ණ', 'ඬ', 'ත', 'ථ', 'ද', 'ධ'],
  ['ප', 'ඵ', 'බ', 'භ', 'ම', 'ඹ', 'ය', 'ර', 'ල', 'ව'],
  ['ශ', 'ෂ', 'ස', 'හ', 'ළ', 'ෆ', 'අ', 'ආ', 'ඇ', 'ඈ']
];

const SI_LAYOUT_SHIFT = [
  ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')'],
  ['ඤ', 'ඥ', 'ඦ', 'ඳ', 'න', 'ඉ', 'ඊ', 'උ', 'ඌ', 'ඍ'],
  ['ඎ', 'එ', 'ඒ', 'ඓ', 'ඔ', 'ඕ', 'ඖ', 'ං', 'ඃ', '෴'],
  ['।', '॥', '?', '/', ',', '.', ':', ';', '"', "'"],
  ['[', ']', '{', '}', '<', '>', '+', '-', '=', '_']
];

const SI_VOWELS = ['්', 'ා', 'ැ', 'ෑ', 'ි', 'ී', 'ු', 'ූ', 'ෘ', 'ෙ', 'ේ', 'ෛ', 'ො', 'ෝ', 'ෞ'];

export default function VirtualKeyboard({
  isOpen,
  onClose,
  onInput,
  onDelete,
  onEnter,
  language,
  onLanguageToggle
}: VirtualKeyboardProps) {
  const [isShift, setIsShift] = useState(false);
  const dragControls = useDragControls();
  const constraintsRef = useRef(null);
  const layout = language === 'en' ? EN_LAYOUT : (isShift ? SI_LAYOUT_SHIFT : SI_LAYOUT);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none z-[100]">
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          dragConstraints={constraintsRef}
          className="fixed bottom-8 right-8 w-full max-w-2xl pointer-events-auto bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 p-5 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-[2.5rem] select-none overflow-hidden"
        >
          <div className="relative">
            {/* Drag Handle Area */}
            <div 
              onPointerDown={(e) => dragControls.start(e)}
              className="flex justify-between items-center mb-5 px-3 cursor-grab active:cursor-grabbing group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-800 rounded-2xl flex items-center justify-center text-primary shadow-inner border border-gray-700/50">
                  <KeyboardIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Input Terminal</h3>
                  <p className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em]">OmniPOS Virtual System</p>
                </div>
              </div>

              <div className="absolute left-1/2 -translate-x-1/2 top-0 opacity-20 group-hover:opacity-100 transition-opacity">
                <GripHorizontal className="text-white w-6 h-6" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onLanguageToggle}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-gray-700 shadow-sm"
                >
                  <Globe className="w-3.5 h-3.5 text-primary" />
                  {language === 'en' ? 'English' : 'සිංහල'}
                </button>
                <button
                  onClick={onClose}
                  className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

          <div className="flex flex-col gap-2">
            {layout.map((row, rowIndex) => (
              <div key={rowIndex} className="flex justify-center gap-1.5">
                {rowIndex === 3 && (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setIsShift(!isShift)}
                    className={cn(
                      "w-12 h-12 flex items-center justify-center rounded-lg transition-all active:scale-95",
                      isShift ? "bg-primary text-white" : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    )}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                )}
                {row.map((key) => (
                  <button
                    key={key}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onInput(language === 'en' && isShift ? key.toUpperCase() : key)}
                    className="min-w-[44px] h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all active:scale-95 text-lg font-medium border border-gray-700 shadow-sm"
                  >
                    {language === 'en' && isShift ? key.toUpperCase() : key}
                  </button>
                ))}
                {rowIndex === 3 && (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={onDelete}
                    className="w-12 h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-red-400 rounded-lg transition-all active:scale-95 border border-gray-700"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}

            {language === 'si' && (
              <div className="flex justify-center gap-1.5 mt-1 flex-wrap">
                {SI_VOWELS.map((vowel) => (
                  <button
                    key={vowel}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onInput(vowel)}
                    className="min-w-[40px] h-10 flex items-center justify-center bg-gray-800/50 hover:bg-gray-700 text-primary rounded-lg transition-all active:scale-95 text-xl font-bold border border-gray-700"
                  >
                    {vowel}
                  </button>
                ))}
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={onDelete}
                  className="w-12 h-10 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-red-400 rounded-lg transition-all active:scale-95 border border-gray-700"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="flex justify-center gap-1.5 mt-1">
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onInput(' ')}
                className="flex-1 max-w-[400px] h-12 flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-all active:scale-95 border border-gray-700"
              >
                <Space className="w-6 h-6" />
              </button>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={onEnter}
                className="w-24 h-12 flex items-center justify-center bg-primary hover:bg-primary/90 text-white rounded-lg transition-all active:scale-95 font-bold border border-primary/50"
              >
                <CornerDownLeft className="w-5 h-5 mr-2" />
                Enter
              </button>
            </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
