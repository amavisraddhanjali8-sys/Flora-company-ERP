import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  FileText, 
  ChevronLeft, 
  ChevronRight,
  Share2,
  Settings,
  RefreshCw,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface PrintPortalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onDownload?: () => void;
  isGeneratingPDF?: boolean;
}

export default function PrintPortal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  onDownload,
  isGeneratingPDF = false
}: PrintPortalProps) {
  const [zoom, setZoom] = useState(100);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter' | 'Legal' | 'Receipt'>('A4');
  const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (title.toLowerCase().includes('receipt')) {
      setPaperSize('Receipt');
    } else {
      setPaperSize('A4');
    }
  }, [title]);

  const handlePrint = () => {
    // We can't directly control the browser print dialog settings from JS,
    // but we can apply classes that @media print will pick up.
    try {
      window.print();
    } catch (err) {
      console.warn('Browser print failed or blocked:', err);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleResetZoom = () => setZoom(100);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getPaperStyles = () => {
    const dimensions = {
      A4: { width: '210mm', height: '297mm' },
      Letter: { width: '8.5in', height: '11in' },
      Legal: { width: '8.5in', height: '14in' },
      Receipt: { width: '80mm', height: 'auto', minHeight: '200mm' }
    };

    const selected = dimensions[paperSize];
    
    if (orientation === 'Landscape' && paperSize !== 'Receipt') {
      return {
        width: selected.height,
        minHeight: selected.width
      };
    }

    return {
      width: selected.width,
      minHeight: selected.height || selected.minHeight
    };
  };

  return (
    <AnimatePresence>
      <motion.div
        key="print-portal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-gray-900/95 backdrop-blur-xl print:hidden"
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: ${paperSize} ${orientation.toLowerCase()};
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: white !important;
            }
            .print-only {
              display: block !important;
              width: 100% !important;
            }
            .print-content {
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 10mm !important;
              box-shadow: none !important;
              transform: none !important;
            }
          }
        `}} />
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
            >
              <ChevronLeft size={24} />
            </button>
            <div className="w-px h-8 bg-gray-100 mx-2" />
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight">{title}</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{subtitle || 'Document Preview'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom Controls */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1 mr-4">
              <button 
                onClick={handleZoomOut}
                className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded-lg transition-all"
                title="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button 
                onClick={handleResetZoom}
                className="px-3 py-1 text-[10px] font-black text-gray-600 hover:text-primary transition-all"
              >
                {zoom}%
              </button>
              <button 
                onClick={handleZoomIn}
                className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded-lg transition-all"
                title="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
            </div>

            {onDownload && (
              <button 
                onClick={onDownload}
                disabled={isGeneratingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {isGeneratingPDF ? <RefreshCw size={14} className="animate-spin" /> : <Download size={14} />}
                Download PDF
              </button>
            )}
            
            <button 
              onClick={handlePrint}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              <Printer size={14} />
              Print Document
            </button>

            <div className="w-px h-8 bg-gray-100 mx-2" />
            
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar (Optional Info) */}
          {isSidebarOpen && (
            <aside className="w-72 bg-white border-r border-gray-200 p-6 overflow-y-auto hidden lg:block">
              <div className="space-y-8">
                <div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Print Settings</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase">Paper Size</label>
                      <select 
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value as any)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:border-primary"
                      >
                        <option value="A4">A4 (210 x 297 mm)</option>
                        <option value="Letter">Letter (8.5 x 11 in)</option>
                        <option value="Legal">Legal (8.5 x 14 in)</option>
                        <option value="Receipt">Receipt (80mm)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase">Orientation</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setOrientation('Portrait')}
                          className={cn(
                            "py-2 rounded-lg text-[10px] font-bold transition-all",
                            orientation === 'Portrait' ? "bg-primary/10 text-primary border border-primary/20" : "bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100"
                          )}
                        >
                          Portrait
                        </button>
                        <button 
                          onClick={() => setOrientation('Landscape')}
                          className={cn(
                            "py-2 rounded-lg text-[10px] font-bold transition-all",
                            orientation === 'Landscape' ? "bg-primary/10 text-primary border border-primary/20" : "bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100"
                          )}
                        >
                          Landscape
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-8 border-t border-gray-100">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Document Info</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400 font-bold uppercase">Type</span>
                      <span className="text-gray-900 font-bold">{title}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400 font-bold uppercase">Generated</span>
                      <span className="text-gray-900 font-bold">{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-gray-400 font-bold uppercase">Status</span>
                      <span className="text-green-600 font-bold uppercase tracking-wider">Ready to Print</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                  <div className="flex items-center gap-2 text-primary">
                    <Settings size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Pro Tip</span>
                  </div>
                  <p className="text-[10px] text-gray-600 leading-relaxed font-medium">
                    For best results, ensure "Background Graphics" is enabled in your browser's print settings.
                  </p>
                </div>
              </div>
            </aside>
          )}

          {/* Preview Canvas */}
          <main className="flex-1 bg-gray-800/50 overflow-auto p-8 flex justify-center items-start custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ 
                ...getPaperStyles(),
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              className="bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-sm origin-top"
              ref={previewRef}
            >
              <div className="w-full h-full p-8">
                {children}
              </div>
            </motion.div>
          </main>
        </div>

        {/* Footer Controls */}
        <footer className="h-12 bg-white border-t border-gray-200 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={cn(
                "p-1.5 rounded-lg transition-all",
                isSidebarOpen ? "text-primary bg-primary/10" : "text-gray-400 hover:bg-gray-100"
              )}
              title="Toggle Sidebar"
            >
              <Maximize size={16} />
            </button>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Interactive Print Preview Portal v2.0
            </p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">System Ready</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-2 text-gray-400">
              <Eye size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">High Fidelity Preview</span>
            </div>
          </div>
        </footer>
      </motion.div>

      {/* Print Only Container */}
      <div className="hidden print:block print-only">
        <div className="print-content">
          {children}
        </div>
      </div>
    </AnimatePresence>
  );
}
