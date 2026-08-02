
export const handleHtml2CanvasClone = (clonedDoc: Document) => {
  // Remove all existing style and link tags to prevent html2canvas from parsing them
  // and failing on oklab/oklch functions.
  const styles = Array.from(clonedDoc.getElementsByTagName('style'));
  const links = Array.from(clonedDoc.getElementsByTagName('link'));
  
  styles.forEach(s => s.remove());
  links.forEach(l => l.remove());

  // Add a clean style block with only supported color formats
  const style = clonedDoc.createElement('style');
  style.innerHTML = `
    * { 
      color-scheme: light !important;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 0;
      background: #ffffff !important;
      color: #111827 !important;
    }

    /* Force hex colors for common print elements */
    .text-primary { color: #f97316 !important; }
    .bg-primary { background-color: #f97316 !important; }
    .border-primary { border-color: #f97316 !important; }
    .bg-gray-50 { background-color: #f9fafb !important; }
    .bg-gray-100 { background-color: #f3f4f6 !important; }
    .bg-gray-200 { background-color: #e5e7eb !important; }
    .bg-gray-900 { background-color: #111827 !important; }
    .bg-gray-50\\/50 { background-color: #fcfdfe !important; }
    .text-gray-100 { color: #f3f4f6 !important; }
    .text-gray-400 { color: #9ca3af !important; }
    .text-gray-500 { color: #6b7280 !important; }
    .text-gray-600 { color: #4b5563 !important; }
    .text-gray-700 { color: #374151 !important; }
    .text-gray-900 { color: #111827 !important; }
    .text-emerald-600 { color: #059669 !important; }
    .text-green-600 { color: #16a34a !important; }
    .text-red-600 { color: #dc2626 !important; }
    .border-gray-100 { border-color: #f3f4f6 !important; }
    .border-gray-200 { border-color: #e5e7eb !important; }
    .divide-gray-100 > * + * { border-color: #f3f4f6 !important; }
    .divide-gray-50 > * + * { border-color: #f9fafb !important; }
    
    /* Ensure visibility and crisp structure */
    .flex { display: flex !important; }
    .flex-col { flex-direction: column !important; }
    .justify-between { justify-content: space-between !important; }
    .items-center { align-items: center !important; }
    .gap-2 { gap: 0.5rem !important; }
    .gap-4 { gap: 1rem !important; }
    .p-4 { padding: 1rem !important; }
    .p-6 { padding: 1.5rem !important; }
    .p-8 { padding: 2rem !important; }
    .m-0 { margin: 0 !important; }
    .w-full { width: 100% !important; }
    .h-full { height: 100% !important; }
    .rounded-xl { border-radius: 0.75rem !important; }
    .rounded-2xl { border-radius: 1rem !important; }
    .font-bold { font-weight: 700 !important; }
    .font-black { font-weight: 900 !important; }
    .uppercase { text-transform: uppercase !important; }
    .text-xs { font-size: 0.75rem !important; }
    .text-sm { font-size: 0.875rem !important; }
    .text-lg { font-size: 1.125rem !important; }
    .text-xl { font-size: 1.5rem !important; }
    .text-2xl { font-size: 1.5rem !important; }
  `;
  clonedDoc.head.appendChild(style);

  const elements = Array.from(clonedDoc.getElementsByTagName('*'));
  
  const propsToPreserve = [
    'display', 'flex-direction', 'justify-content', 'align-items', 'flex-wrap', 'flex-grow', 'flex-shrink', 'flex-basis',
    'grid-template-columns', 'grid-template-rows', 'grid-column', 'grid-row', 'gap', 'column-gap', 'row-gap',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
    'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-align', 'text-transform', 'text-decoration',
    'color', 'background-color', 'border-color', 'border-width', 'border-style', 'border-radius',
    'opacity', 'visibility', 'box-shadow', 'overflow', 'position', 'top', 'right', 'bottom', 'left',
    'box-sizing', 'list-style', 'table-layout', 'border-collapse', 'border-spacing'
  ];

  elements.forEach(el => {
    const htmlEl = el as HTMLElement;
    const computedStyle = window.getComputedStyle(htmlEl);
    
    propsToPreserve.forEach(prop => {
      const val = computedStyle.getPropertyValue(prop);
      if (val) {
        if (val.includes('oklab') || val.includes('oklch')) return;
        if ((prop === 'width' || prop === 'height') && val === 'auto') return;
        htmlEl.style.setProperty(prop, val);
      }
    });

    if (htmlEl.tagName === 'IMG') {
      const img = htmlEl as HTMLImageElement;
      if (!img.style.width && img.width) img.style.width = img.width + 'px';
      if (!img.style.height && img.height) img.style.height = img.height + 'px';
    }
  });
};

/**
 * Enhanced Canvas-to-PDF Slicer with Margins, Headers, Footers, and Page Numbers
 */
export async function exportHtmlElementToPdf({
  element,
  documentTitle,
  companyName,
  filename
}: {
  element: HTMLElement;
  documentTitle: string;
  companyName: string;
  filename: string;
}) {
  const html2canvas = (await import('html2canvas')).default;
  const { jsPDF } = await import('jspdf');

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 1024,
    onclone: handleHtml2CanvasClone
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();   // 210mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

  const marginLeft = 10;
  const marginRight = 10;
  const marginTop = 18;
  const marginBottom = 16;

  const usableWidth = pdfWidth - marginLeft - marginRight;   // 190mm
  const usableHeight = pdfHeight - marginTop - marginBottom; // 263mm

  const totalCanvasHeightMm = (canvas.height * usableWidth) / canvas.width;
  const totalPages = Math.max(1, Math.ceil(totalCanvasHeightMm / usableHeight));

  const sliceHeightPx = Math.floor((usableHeight * canvas.width) / usableWidth);

  for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
    if (pageIdx > 0) {
      pdf.addPage();
    }

    const srcY = pageIdx * sliceHeightPx;
    const currentSlicePx = Math.min(sliceHeightPx, canvas.height - srcY);

    if (currentSlicePx > 0) {
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = canvas.width;
      cropCanvas.height = currentSlicePx;
      const ctx = cropCanvas.getContext('2d');

      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
        ctx.drawImage(
          canvas,
          0, srcY, canvas.width, currentSlicePx,
          0, 0, canvas.width, currentSlicePx
        );

        const sliceDataUrl = cropCanvas.toDataURL('image/jpeg', 0.95);
        const drawHeightMm = (currentSlicePx * usableWidth) / canvas.width;

        pdf.addImage(
          sliceDataUrl,
          'JPEG',
          marginLeft,
          marginTop,
          usableWidth,
          drawHeightMm,
          undefined,
          'FAST'
        );
      }
    }

    // --- Header ---
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(17, 24, 39); // #111827
    pdf.text(companyName.toUpperCase(), marginLeft, 9);

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(249, 115, 22); // #f97316
    pdf.setFontSize(8);
    pdf.text(documentTitle.toUpperCase(), pdfWidth - marginRight, 9, { align: 'right' });

    pdf.setDrawColor(249, 115, 22);
    pdf.setLineWidth(0.4);
    pdf.line(marginLeft, 12, pdfWidth - marginRight, 12);

    // --- Footer ---
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.3);
    pdf.line(marginLeft, pdfHeight - 11, pdfWidth - marginRight, pdfHeight - 11);

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128); // #6b7280
    pdf.text(
      `CONFIDENTIAL - ${companyName} FINANCIAL SYSTEM`,
      marginLeft,
      pdfHeight - 6
    );

    pdf.setFont('helvetica', 'bold');
    pdf.text(
      `Page ${pageIdx + 1} of ${totalPages}`,
      pdfWidth - marginRight,
      pdfHeight - 6,
      { align: 'right' }
    );
  }

  pdf.save(filename);
}

