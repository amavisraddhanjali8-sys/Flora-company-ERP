import React, { useState, useRef, useEffect } from 'react';
import { X, QrCode, Search, Printer, Camera, Check, RefreshCw, Sparkles, Package, Layers, ShoppingBag, Truck, Tag, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Barcode from 'react-barcode';
import { FinishedProduct, Material, Order, ProcurementOrder } from '../../types';
import { cn } from '../../lib/utils';

interface BarcodeHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: FinishedProduct[];
  materials: Material[];
  orders: Order[];
  procurementOrders: ProcurementOrder[];
  onUpdateProduct?: (product: FinishedProduct) => void;
  onUpdateMaterial?: (material: Material) => void;
  onAddToCart?: (product: FinishedProduct) => void;
}

export default function BarcodeHubModal({
  isOpen,
  onClose,
  products,
  materials,
  orders,
  procurementOrders,
  onUpdateProduct,
  onUpdateMaterial,
  onAddToCart
}: BarcodeHubModalProps) {
  const [activeTab, setActiveTab] = useState<'scanner' | 'labelPrinter' | 'batchGen'>('scanner');
  const [searchQuery, setSearchQuery] = useState('');
  const [scannedResult, setScannedResult] = useState<{
    type: 'Product' | 'Material' | 'Order' | 'Procurement';
    item: any;
  } | null>(null);

  // Label Printer state
  const [selectedItem, setSelectedItem] = useState<{ type: 'Product' | 'Material' | 'Order'; item: any } | null>(null);
  const [labelSize, setLabelSize] = useState<'50x30' | '40x20' | '30x15'>('50x30');
  const [copies, setCopies] = useState<number>(1);
  const [showPriceOnLabel, setShowPriceOnLabel] = useState<boolean>(true);
  const [showCategoryOnLabel, setShowCategoryOnLabel] = useState<boolean>(true);

  // Camera Scanner state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Auto-scan input ref
  const scannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'scanner') {
      setTimeout(() => scannerInputRef.current?.focus(), 100);
    }
  }, [isOpen, activeTab]);

  // Clean camera stream on close or tab change
  useEffect(() => {
    if (!isOpen || activeTab !== 'scanner') {
      stopCamera();
    }
  }, [isOpen, activeTab]);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setIsCameraActive(false);
      alert('Camera access denied or unavailable on this device. You can use a USB barcode scanner or type manually.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const q = query.trim().toLowerCase();
    if (!q) {
      setScannedResult(null);
      return;
    }

    // 1. Search in products
    const prod = products.find(p => p.id.toLowerCase() === q || (p.barcode && p.barcode.toLowerCase() === q) || p.name.toLowerCase().includes(q));
    if (prod) {
      setScannedResult({ type: 'Product', item: prod });
      setSelectedItem({ type: 'Product', item: prod });
      return;
    }

    // 2. Search in materials
    const mat = materials.find(m => m.id.toLowerCase() === q || (m.barcode && m.barcode.toLowerCase() === q) || m.name.toLowerCase().includes(q));
    if (mat) {
      setScannedResult({ type: 'Material', item: mat });
      setSelectedItem({ type: 'Material', item: mat });
      return;
    }

    // 3. Search in orders
    const ord = orders.find(o => o.id.toLowerCase() === q || o.orderNumber?.toLowerCase() === q || o.clientName?.toLowerCase().includes(q));
    if (ord) {
      setScannedResult({ type: 'Order', item: ord });
      setSelectedItem({ type: 'Order', item: ord });
      return;
    }

    // 4. Search in procurement orders
    const po = procurementOrders.find(p => p.id.toLowerCase() === q || p.poNumber?.toLowerCase() === q || p.supplierName?.toLowerCase().includes(q));
    if (po) {
      setScannedResult({ type: 'Procurement', item: po });
      return;
    }

    setScannedResult(null);
  };

  // Auto generate missing barcodes
  const handleAutoGenerateMissingBarcodes = () => {
    let updatedProductsCount = 0;
    let updatedMaterialsCount = 0;

    products.forEach(p => {
      if (!p.barcode && onUpdateProduct) {
        const generated = `FLR-${Math.floor(100000 + Math.random() * 900000)}`;
        onUpdateProduct({ ...p, barcode: generated });
        updatedProductsCount++;
      }
    });

    materials.forEach(m => {
      if (!m.barcode && onUpdateMaterial) {
        const generated = `MAT-${Math.floor(100000 + Math.random() * 900000)}`;
        onUpdateMaterial({ ...m, barcode: generated });
        updatedMaterialsCount++;
      }
    });

    alert(`Successfully generated barcodes!\n- ${updatedProductsCount} Products updated\n- ${updatedMaterialsCount} Materials updated`);
  };

  // Print Barcode Label
  const handlePrintLabels = () => {
    if (!selectedItem) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const code = selectedItem.item.barcode || selectedItem.item.id;
    const name = selectedItem.item.name || selectedItem.item.clientName || 'Item';
    const category = selectedItem.item.category || selectedItem.item.type || '';
    const price = selectedItem.item.price !== undefined ? `$${selectedItem.item.price.toFixed(2)}` : selectedItem.item.costPerUnit !== undefined ? `$${selectedItem.item.costPerUnit.toFixed(2)}` : '';

    let labelHtml = '';
    for (let i = 0; i < copies; i++) {
      labelHtml += `
        <div class="label-card">
          <div class="brand">PETAL LOVER BIOPHILIC</div>
          <div class="item-name">${name}</div>
          ${showCategoryOnLabel ? `<div class="category">${category}</div>` : ''}
          <div class="barcode-container" id="bc-${i}"></div>
          <div class="code-text">${code}</div>
          ${showPriceOnLabel && price ? `<div class="price">${price}</div>` : ''}
        </div>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Barcode Labels - ${name}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <style>
            @page {
              size: auto;
              margin: 2mm;
            }
            body {
              font-family: 'Segoe UI', system-ui, sans-serif;
              margin: 0;
              padding: 10px;
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              background: #fff;
            }
            .label-card {
              width: ${labelSize === '50x30' ? '50mm' : labelSize === '40x20' ? '40mm' : '30mm'};
              height: ${labelSize === '50x30' ? '30mm' : labelSize === '40x20' ? '20mm' : '15mm'};
              border: 1px dashed #ccc;
              box-sizing: border-box;
              padding: 2mm;
              display: flex;
              flex-col: column;
              align-items: center;
              justify-content: center;
              text-align: center;
              page-break-inside: avoid;
            }
            .brand {
              font-size: 6px;
              font-weight: 900;
              letter-spacing: 0.5px;
              color: #059669;
              text-transform: uppercase;
            }
            .item-name {
              font-size: 8px;
              font-weight: 800;
              color: #111;
              max-height: 12px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              width: 100%;
            }
            .category {
              font-size: 6px;
              color: #666;
            }
            svg {
              max-width: 90%;
              height: auto;
              max-height: 16mm;
            }
            .code-text {
              font-size: 7px;
              font-family: monospace;
              font-weight: bold;
            }
            .price {
              font-size: 9px;
              font-weight: 900;
              color: #000;
            }
          </style>
        </head>
        <body>
          ${labelHtml}
          <script>
            window.onload = function() {
              for (let i = 0; i < ${copies}; i++) {
                const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                document.getElementById('bc-' + i).appendChild(el);
                JsBarcode(el, "${code}", {
                  format: "CODE128",
                  width: 1.5,
                  height: 35,
                  displayValue: false
                });
              }
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[2rem] w-full max-w-4xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col my-auto max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white">
                  <QrCode size={22} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">Barcode & Thermal Tag Studio</h2>
                  <p className="text-[10px] text-emerald-100 font-extrabold uppercase tracking-widest">Universal Scanner, Identification & Label Generator</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('scanner')}
                className={cn(
                  "flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
                  activeTab === 'scanner'
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Search size={15} /> Instant Scanner & Lookup
              </button>
              <button
                onClick={() => setActiveTab('labelPrinter')}
                className={cn(
                  "flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
                  activeTab === 'labelPrinter'
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Printer size={15} /> Label & Tag Printer
              </button>
              <button
                onClick={() => setActiveTab('batchGen')}
                className={cn(
                  "flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
                  activeTab === 'batchGen'
                    ? "bg-white text-emerald-700 shadow-xs border border-slate-200"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Sparkles size={15} /> Auto-Generate Barcodes
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {activeTab === 'scanner' && (
                <div className="space-y-6">
                  {/* Search Bar & Camera toggle */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        ref={scannerInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        placeholder="Scan USB Barcode or type SKU / Barcode / Name..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-all shadow-inner"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => (isCameraActive ? stopCamera() : startCamera())}
                      className={cn(
                        "px-4 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 border shrink-0",
                        isCameraActive
                          ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      )}
                    >
                      <Camera size={16} />
                      {isCameraActive ? 'Close Camera' : 'Scan via Camera'}
                    </button>
                  </div>

                  {/* Camera Stream View */}
                  {isCameraActive && (
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-60 flex items-center justify-center border-2 border-emerald-500">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                      <div className="absolute inset-0 border-2 border-emerald-400 border-dashed rounded-xl m-8 pointer-events-none flex items-center justify-center">
                        <span className="text-[10px] font-black text-white bg-black/60 px-3 py-1 rounded-full uppercase tracking-widest">Position barcode inside box</span>
                      </div>
                    </div>
                  )}

                  {/* Identification Result Card */}
                  {scannedResult ? (
                    <div className="bg-gradient-to-r from-emerald-50/80 via-teal-50/50 to-white p-5 rounded-2xl border border-emerald-200 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md">
                            {scannedResult.type === 'Product' && <Package size={22} />}
                            {scannedResult.type === 'Material' && <Layers size={22} />}
                            {scannedResult.type === 'Order' && <ShoppingBag size={22} />}
                            {scannedResult.type === 'Procurement' && <Truck size={22} />}
                          </div>
                          <div>
                            <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                              Identified {scannedResult.type}
                            </span>
                            <h3 className="text-base font-black text-slate-900 mt-1">
                              {scannedResult.item.name || scannedResult.item.clientName || scannedResult.item.supplierName || 'Scanned Item'}
                            </h3>
                            <p className="text-xs text-slate-500 font-mono font-bold">
                              Barcode / ID: {scannedResult.item.barcode || scannedResult.item.id}
                            </p>
                          </div>
                        </div>

                        {/* Barcode visual preview */}
                        <div className="bg-white p-2 rounded-xl border border-slate-200">
                          <Barcode
                            value={scannedResult.item.barcode || scannedResult.item.id}
                            width={1.2}
                            height={30}
                            fontSize={10}
                          />
                        </div>
                      </div>

                      {/* Item Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 p-3 rounded-xl border border-emerald-100 text-xs">
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Category/Type</span>
                          <span className="font-bold text-slate-800">{scannedResult.item.category || scannedResult.item.type || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Stock / Qty</span>
                          <span className="font-black text-emerald-700">{scannedResult.item.stock !== undefined ? `${scannedResult.item.stock} in stock` : 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Unit Price / Cost</span>
                          <span className="font-black text-slate-900">
                            {scannedResult.item.price !== undefined ? `$${scannedResult.item.price.toFixed(2)}` : scannedResult.item.costPerUnit !== undefined ? `$${scannedResult.item.costPerUnit.toFixed(2)}` : 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Status</span>
                          <span className="font-bold text-slate-800">{scannedResult.item.status || 'Active'}</span>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-200/60">
                        {scannedResult.type === 'Product' && onAddToCart && (
                          <button
                            onClick={() => {
                              onAddToCart(scannedResult.item);
                              alert(`Added ${scannedResult.item.name} to POS Cart!`);
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            + Add to POS Cart
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedItem({ type: scannedResult.type as any, item: scannedResult.item });
                            setActiveTab('labelPrinter');
                          }}
                          className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Printer size={14} /> Print Sticker Label
                        </button>
                      </div>
                    </div>
                  ) : searchQuery ? (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                      <p className="text-xs font-bold text-slate-500">No matching item or order found for barcode: <span className="font-mono text-emerald-700 font-black">{searchQuery}</span></p>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50/60 border border-dashed border-slate-200 rounded-2xl space-y-2">
                      <QrCode size={36} className="text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-600">Scan any barcode using USB scanner or camera to view instant record details.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'labelPrinter' && (
                <div className="space-y-6">
                  {/* Select Item to Print */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Item or Material for Label Printing</label>
                    <select
                      value={selectedItem ? `${selectedItem.type}:${selectedItem.item.id}` : ''}
                      onChange={(e) => {
                        const [type, id] = e.target.value.split(':');
                        if (type === 'Product') {
                          const p = products.find(x => x.id === id);
                          if (p) setSelectedItem({ type: 'Product', item: p });
                        } else if (type === 'Material') {
                          const m = materials.find(x => x.id === id);
                          if (m) setSelectedItem({ type: 'Material', item: m });
                        } else if (type === 'Order') {
                          const o = orders.find(x => x.id === id);
                          if (o) setSelectedItem({ type: 'Order', item: o });
                        }
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500 transition-all"
                    >
                      <option value="">-- Choose Item / Material / Order --</option>
                      <optgroup label="Finished Products Catalog">
                        {products.map(p => (
                          <option key={p.id} value={`Product:${p.id}`}>
                            {p.name} (Barcode: {p.barcode || p.id})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Botanical & Infrastructure Materials">
                        {materials.map(m => (
                          <option key={m.id} value={`Material:${m.id}`}>
                            {m.name} ({m.type}) (Barcode: {m.barcode || m.id})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Client Installation Orders">
                        {orders.map(o => (
                          <option key={o.id} value={`Order:${o.id}`}>
                            Order #{o.orderNumber || o.id} - {o.clientName}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {/* Label Customizer Controls */}
                  {selectedItem && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                      {/* Left side: options */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Thermal Sticker Configuration</h4>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase">Label Sticker Size</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(['50x30', '40x20', '30x15'] as const).map(size => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setLabelSize(size)}
                                className={cn(
                                  "py-2 px-3 text-xs font-black rounded-xl border transition-all",
                                  labelSize === size
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                                )}
                              >
                                {size} mm
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-500 uppercase">Print Copies (Quantity)</label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={copies}
                            onChange={(e) => setCopies(Math.max(1, Number(e.target.value)))}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                          />
                        </div>

                        <div className="space-y-2 pt-2 border-t border-slate-200">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                            <input
                              type="checkbox"
                              checked={showPriceOnLabel}
                              onChange={(e) => setShowPriceOnLabel(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            Display Price / Cost on Label
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                            <input
                              type="checkbox"
                              checked={showCategoryOnLabel}
                              onChange={(e) => setShowCategoryOnLabel(e.target.checked)}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            Display Category on Label
                          </label>
                        </div>

                        <button
                          onClick={handlePrintLabels}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 mt-4"
                        >
                          <Printer size={16} /> Print {copies} Sticker Label{copies > 1 ? 's' : ''}
                        </button>
                      </div>

                      {/* Right side: Live Label Preview */}
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Sticker Tag Preview</span>
                        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex flex-col items-center justify-center text-center max-w-[220px] w-full min-h-[120px]">
                          <span className="text-[8px] font-black tracking-widest text-emerald-600 uppercase">PETAL LOVER BIOPHILIC</span>
                          <span className="text-xs font-black text-slate-900 truncate w-full px-1">
                            {selectedItem.item.name || selectedItem.item.clientName || 'Item Name'}
                          </span>
                          {showCategoryOnLabel && (
                            <span className="text-[9px] text-slate-400 font-semibold">
                              {selectedItem.item.category || selectedItem.item.type || ''}
                            </span>
                          )}
                          <div className="my-1">
                            <Barcode
                              value={selectedItem.item.barcode || selectedItem.item.id}
                              width={1.2}
                              height={35}
                              fontSize={10}
                            />
                          </div>
                          {showPriceOnLabel && (
                            <span className="text-xs font-black text-slate-900">
                              {selectedItem.item.price !== undefined ? `$${selectedItem.item.price.toFixed(2)}` : selectedItem.item.costPerUnit !== undefined ? `$${selectedItem.item.costPerUnit.toFixed(2)}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'batchGen' && (
                <div className="space-y-6">
                  <div className="p-6 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-200 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-600 text-white rounded-xl flex items-center justify-center">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">Auto-Generate Missing Barcodes</h3>
                        <p className="text-xs text-slate-500">Automatically assign unique standard barcodes to all Products & Botanical Materials currently missing a barcode code.</p>
                      </div>
                    </div>

                    <button
                      onClick={handleAutoGenerateMissingBarcodes}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md flex items-center gap-2"
                    >
                      <RefreshCw size={15} /> Auto-Assign Missing Barcodes
                    </button>
                  </div>

                  {/* Summary of Items without barcodes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Products Barcode Status</span>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Total Catalog Items</span>
                        <span className="text-sm font-black text-slate-900">{products.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-700">
                        <span className="text-xs font-bold">With Barcode</span>
                        <span className="text-sm font-black">{products.filter(p => !!p.barcode).length}</span>
                      </div>
                      <div className="flex justify-between items-center text-rose-600">
                        <span className="text-xs font-bold">Missing Barcode</span>
                        <span className="text-sm font-black">{products.filter(p => !p.barcode).length}</span>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Botanical Stock Barcode Status</span>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-700">Total Material Resources</span>
                        <span className="text-sm font-black text-slate-900">{materials.length}</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-700">
                        <span className="text-xs font-bold">With Barcode</span>
                        <span className="text-sm font-black">{materials.filter(m => !!m.barcode).length}</span>
                      </div>
                      <div className="flex justify-between items-center text-rose-600">
                        <span className="text-xs font-bold">Missing Barcode</span>
                        <span className="text-sm font-black">{materials.filter(m => !m.barcode).length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
