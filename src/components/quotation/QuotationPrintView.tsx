import React from 'react';
import { formatCurrency } from '../../lib/utils';
import { Quotation, CompanySettings } from '../../types';

interface QuotationPrintViewProps {
  quotation: Quotation;
  settings: CompanySettings;
}

export default function QuotationPrintView({ quotation, settings }: QuotationPrintViewProps) {
  return (
    <div className="bg-white w-full h-full text-[10pt] font-sans leading-tight flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .print-hidden { display: none !important; }
        }
      `}} />
      
      {/* Header Table */}
      <table className="w-full border-collapse mb-6 border-b-2 border-primary pb-4">
        <tbody>
          <tr>
            <td className="align-top">
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-white flex items-center justify-center text-white font-black text-2xl rounded shadow-sm border border-gray-100 overflow-hidden">
                  {settings.logo ? (
                    <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-primary flex items-center justify-center">
                      {settings.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">{settings.name}</h1>
                  <p className="text-gray-500 text-[8pt] whitespace-pre-line max-w-[250px]">{settings.address}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {settings.phones.map((p, i) => (
                      <p key={i} className="text-gray-500 text-[8pt] font-bold">Tel: <span className="font-normal">{p}</span></p>
                    ))}
                    <p className="text-gray-500 text-[8pt] font-bold">Email: <span className="font-normal">{settings.email}</span></p>
                  </div>
                  <p className="text-primary text-[8pt] font-bold">{settings.website}</p>
                  {settings.taxId && <p className="text-gray-900 text-[8pt] font-black uppercase mt-1">TAX ID: {settings.taxId}</p>}
                </div>
              </div>
            </td>
            <td className="align-top text-right">
              <h2 className="text-4xl font-black text-gray-100 uppercase tracking-[0.1em] mb-2 leading-none">Quotation</h2>
              <div className="space-y-0.5 text-[9pt]">
                <p className="text-gray-500 font-bold uppercase tracking-wider">Quote Number: <span className="text-gray-900 font-mono ml-2">{quotation.quoteNumber}</span></p>
                <p className="text-gray-500 font-bold uppercase tracking-wider">Quote Date: <span className="text-gray-900 ml-2">{quotation.date}</span></p>
                <p className="text-gray-500 font-bold uppercase tracking-wider">Valid Thru: <span className="text-gray-900 ml-2">{new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span></p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Addresses Table */}
      <table className="w-full border-collapse mb-6">
        <tbody>
          <tr>
            <td className="w-1/2 pr-3 align-top">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 h-full">
                <h3 className="text-[7pt] font-black text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-200 pb-1">Quoted To:</h3>
                <div className="space-y-0.5">
                  <p className="font-black text-gray-900 text-[10pt]">{quotation.clientName}</p>
                  <p className="text-gray-600 text-[8pt]">Customer ID: {quotation.clientId}</p>
                  <p className="text-gray-500 text-[7pt] italic">Contact details on file</p>
                </div>
              </div>
            </td>
            <td className="w-1/2 pl-3 align-top">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 h-full">
                <h3 className="text-[7pt] font-black text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-200 pb-1">Payment Info:</h3>
                <div className="space-y-0.5 text-[8pt]">
                  {(() => {
                    const bank = settings.bankDetails.find(b => b.id === quotation.bankId) || settings.bankDetails[0];
                    if (!bank) return <p className="text-gray-400 italic">No bank details provided</p>;
                    return (
                      <>
                        <p className="text-gray-700 font-bold">Bank: <span className="font-normal">{bank.bankName}</span></p>
                        <p className="text-gray-700 font-bold">Account: <span className="font-normal">{bank.accountNumber}</span></p>
                        <p className="text-gray-700 font-bold">Branch: <span className="font-normal">{bank.branch}</span></p>
                        {bank.accountHolder && <p className="text-gray-700 font-bold">Holder: <span className="font-normal">{bank.accountHolder}</span></p>}
                      </>
                    );
                  })()}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <div className="flex-1">
        <table className="w-full border-collapse mb-6 text-[9pt]">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-3 py-1.5 text-left font-bold uppercase tracking-wider rounded-tl-lg">Description</th>
              <th className="px-3 py-1.5 text-center font-bold uppercase tracking-wider w-16">Qty</th>
              <th className="px-3 py-1.5 text-right font-bold uppercase tracking-wider w-28">Unit Price</th>
              <th className="px-3 py-1.5 text-right font-bold uppercase tracking-wider w-28 rounded-tr-lg">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-x border-b border-gray-100 rounded-b-lg overflow-hidden">
            {quotation.items.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors break-inside-avoid">
                <td className="px-3 py-2">
                  <p className="font-bold text-gray-900">{item.name}</p>
                  <p className="text-[7pt] text-gray-400 uppercase font-bold">{item.category}</p>
                </td>
                <td className="px-3 py-2 text-center font-medium text-gray-600">{(item.quantity || 0).toFixed(2)}</td>
                <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(item.price)}</td>
                <td className="px-3 py-2 text-right font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</td>
              </tr>
            ))}
            {/* Fill empty rows to maintain layout */}
            {Array.from({ length: Math.max(0, 5 - quotation.items.length) }).map((_, i) => (
              <tr key={`empty-${i}`} className="h-8">
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2"></td>
                <td className="px-3 py-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals & Terms Table */}
      <table className="w-full border-collapse mb-8">
        <tbody>
          <tr>
            <td className="w-1/2 pr-6 align-top">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[8pt] font-black uppercase text-gray-400 mb-2 tracking-widest border-b border-gray-100 pb-1">Terms & Conditions:</h4>
                  <ul className="list-decimal list-inside text-[8pt] text-gray-500 space-y-1 pl-2">
                    {quotation.terms.map((t, i) => <li key={i} className="leading-relaxed">{t}</li>)}
                  </ul>
                </div>
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                      <span className="text-[8pt] font-black text-gray-300">QR</span>
                    </div>
                    <div>
                      <p className="text-[8pt] font-bold text-gray-900 uppercase">Scan to Pay</p>
                      <p className="text-[7pt] text-gray-400">Use any banking app</p>
                    </div>
                  </div>
                </div>
              </div>
            </td>
            <td className="w-1/2 pl-6 align-top">
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-3">
                <div className="flex justify-between text-[9pt] text-gray-500">
                  <span className="font-bold uppercase tracking-wider">Subtotal</span>
                  <span className="font-mono">{formatCurrency(quotation.subtotal)}</span>
                </div>
                {quotation.discount > 0 && (
                  <div className="flex justify-between text-[9pt] text-red-500">
                    <span className="font-bold uppercase tracking-wider">Discount {quotation.discountRate > 0 ? `(${quotation.discountRate}%)` : ''}</span>
                    <span className="font-mono">-{formatCurrency(quotation.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[9pt] text-gray-500">
                  <span className="font-bold uppercase tracking-wider">Sales Tax ({(quotation.taxRate || 0).toFixed(1)}%)</span>
                  <span className="font-mono">{formatCurrency(quotation.tax)}</span>
                </div>
                {quotation.freight > 0 && (
                  <div className="flex justify-between text-[9pt] text-gray-500">
                    <span className="font-bold uppercase tracking-wider">Freight</span>
                    <span className="font-mono">{formatCurrency(quotation.freight)}</span>
                  </div>
                )}
                {quotation.otherChargesList && quotation.otherChargesList.length > 0 ? (
                  quotation.otherChargesList.map((charge, i) => (
                    <div key={i} className="flex justify-between text-[9pt] text-gray-500">
                      <span className="font-bold uppercase tracking-wider">{charge.description || 'Other Charge'}</span>
                      <span className="font-mono">{formatCurrency(charge.amount)}</span>
                    </div>
                  ))
                ) : (
                  quotation.otherCharges > 0 && (
                    <div className="flex justify-between text-[9pt] text-gray-500">
                      <span className="font-bold uppercase tracking-wider">Other Charges</span>
                      <span className="font-mono">{formatCurrency(quotation.otherCharges)}</span>
                    </div>
                  )
                )}
                {quotation.advancePercentage && (
                  <div className="mt-4 p-4 bg-primary/5 rounded-2xl border-2 border-primary/20">
                    <div className="flex justify-between items-center">
                      <div className="space-y-0.5">
                        <span className="text-[9pt] font-black text-primary uppercase tracking-[0.15em]">Advance Payment Required</span>
                        <p className="text-[7pt] text-gray-500 font-bold uppercase">To commence order processing ({quotation.advancePercentage}%)</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[16pt] font-black text-primary leading-none block">{formatCurrency(quotation.total * (quotation.advancePercentage / 100))}</span>
                        <p className="text-[8pt] text-gray-400 font-mono">Balance: {formatCurrency(quotation.total - (quotation.total * (quotation.advancePercentage / 100)))}</p>
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-[8pt] text-gray-400 text-right italic pt-2">All prices in {settings.currency}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Attachments (Designs) */}
      {quotation.attachments && quotation.attachments.length > 0 && (
        <div className="mb-8 break-inside-avoid">
          <h4 className="text-[8pt] font-black uppercase text-gray-400 mb-3 tracking-widest border-b border-gray-100 pb-1">Product Samples & Designs:</h4>
          <div className="grid grid-cols-4 gap-4">
            {quotation.attachments.map((img, i) => (
              <div key={i} className="aspect-square bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                <img src={img} alt={`Design ${i+1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terms & Conditions (Global) */}
      {settings.terms.length > 0 && (
        <div className="mb-6 bg-gray-50/50 rounded-xl p-4 border border-gray-100 break-inside-avoid">
          <h3 className="text-[7pt] font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Terms & Conditions:</h3>
          <div className="space-y-1">
            {settings.terms.map((term, i) => (
              <p key={i} className="text-[7pt] text-gray-600 leading-tight flex gap-2">
                <span className="font-bold text-gray-400">{i + 1}.</span>
                {term.text}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Footer Table */}
      <table className="w-full border-collapse mt-auto pt-8 border-t border-gray-100">
        <tbody>
          <tr>
            <td className="align-bottom">
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <div className="flex gap-[1px] h-10">
                    {[2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 1, 5, 2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 1, 5, 2, 4, 1, 3, 2, 5, 1, 4, 2, 3, 1, 5].map((w, i) => (
                      <div key={i} className="bg-black" style={{ width: `${w}px` }} />
                    ))}
                  </div>
                  <p className="text-[7pt] font-mono uppercase tracking-[0.5em] text-center text-gray-400">{quotation.quoteNumber}</p>
                </div>
                <p className="text-[7pt] text-gray-400 font-medium italic">This is a computer generated document. No signature required.</p>
              </div>
            </td>
            <td className="align-bottom text-right">
              <div className="w-48 border-t-2 border-gray-900 pt-2 ml-auto">
                <p className="text-[8pt] font-black text-gray-900 uppercase tracking-widest">Authorized By</p>
                <p className="text-[7pt] text-gray-400 uppercase">{settings.name}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
