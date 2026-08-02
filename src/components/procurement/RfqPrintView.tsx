import React from 'react';
import { RFQ, CompanySettings, Supplier } from '../../types';

interface RfqPrintViewProps {
  rfq: RFQ;
  settings: CompanySettings;
  suppliers: Supplier[];
}

export default function RfqPrintView({ rfq, settings, suppliers }: RfqPrintViewProps) {
  const taggedSuppliers = suppliers.filter(s => rfq.suppliers.includes(s.id));

  return (
    <div className="bg-white w-full h-full text-[10pt] font-sans leading-tight flex flex-col p-6">
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
                  <p className="text-gray-500 text-[8pt] whitespace-pre-line max-w-[280px]">{settings.address}</p>
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
              <h2 className="text-3xl font-black text-gray-800 uppercase tracking-wider mb-2 leading-none">Request For Quotation</h2>
              <p className="text-[9pt] font-bold text-primary uppercase mb-2">RFQ DOCUMENT</p>
              <div className="space-y-0.5 text-[9pt]">
                <p className="text-gray-500 font-bold uppercase tracking-wider">RFQ Ref: <span className="text-gray-900 font-mono ml-2">{rfq.rfqNumber}</span></p>
                <p className="text-gray-500 font-bold uppercase tracking-wider">Issue Date: <span className="text-gray-900 ml-2">{new Date(rfq.date).toLocaleDateString()}</span></p>
                <p className="text-gray-500 font-bold uppercase tracking-wider">Deadline: <span className="text-red-600 font-bold ml-2">{new Date(rfq.deadline).toLocaleDateString()}</span></p>
                {rfq.orderNumber && (
                  <p className="text-gray-500 font-bold uppercase tracking-wider">Linked Order: <span className="text-indigo-600 font-bold ml-2">{rfq.orderNumber}</span></p>
                )}
                {rfq.type && (
                  <p className="text-gray-500 font-bold uppercase tracking-wider">Category: <span className="text-gray-900 ml-2">{rfq.type}</span></p>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Target Suppliers & Request Info */}
      <table className="w-full border-collapse mb-6">
        <tbody>
          <tr>
            <td className="w-1/2 pr-3 align-top">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 h-full">
                <h3 className="text-[7pt] font-black text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-200 pb-1">Target Supplier(s):</h3>
                {taggedSuppliers.length > 0 ? (
                  <div className="space-y-1.5">
                    {taggedSuppliers.map((s, idx) => (
                      <div key={idx} className="border-b border-gray-100 pb-1 last:border-0">
                        <p className="font-bold text-gray-900 text-[9pt]">{s.name}</p>
                        <p className="text-gray-600 text-[8pt]">{s.contactPerson} ({s.phone})</p>
                        <p className="text-gray-500 text-[7pt]">{s.email}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-[8pt] italic">Open Broadcast Request to All Qualified Suppliers</p>
                )}
              </div>
            </td>
            <td className="w-1/2 pl-3 align-top">
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 h-full">
                <h3 className="text-[7pt] font-black text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-200 pb-1">RFQ Guidelines & Submission Instructions:</h3>
                <div className="space-y-1 text-[8pt] text-gray-600">
                  <p>• Please submit unit pricing, lead time, and availability before deadline date.</p>
                  <p>• Include discounts, freight/transport charges, and tax breakdown where applicable.</p>
                  <p>• Prices submitted should remain valid for at least 30 days.</p>
                  <p>• Direct all questions to <span className="font-bold text-gray-800">{settings.email}</span>.</p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Requested Items Table */}
      <div className="flex-1">
        <h3 className="text-[8pt] font-black uppercase tracking-wider text-gray-400 mb-2">Requested Items & Service Specifications:</h3>
        <table className="w-full border-collapse mb-6 text-[9pt]">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-3 py-2 text-left font-bold uppercase tracking-wider rounded-tl-lg w-12">#</th>
              <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Item / Service Description</th>
              <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Specifications & Requirements</th>
              <th className="px-3 py-2 text-center font-bold uppercase tracking-wider w-24">Qty Requested</th>
              <th className="px-3 py-2 text-center font-bold uppercase tracking-wider w-20 rounded-tr-lg">Unit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-x border-b border-gray-200 rounded-b-lg overflow-hidden">
            {rfq.items.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2.5 font-bold text-gray-500">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <p className="font-bold text-gray-900">{item.name}</p>
                </td>
                <td className="px-3 py-2.5 text-gray-600 text-[8pt]">
                  {item.specs || <span className="text-gray-400 italic">Standard industry quality specification</span>}
                </td>
                <td className="px-3 py-2.5 text-center font-black text-gray-900">{item.quantity}</td>
                <td className="px-3 py-2.5 text-center font-bold text-gray-500 uppercase">{item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Terms & Notes */}
      <div className="mt-4 space-y-4">
        {rfq.notes && (
          <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
            <h4 className="text-[8pt] font-black uppercase text-blue-900 mb-1">Special Notes & Buyer Remarks:</h4>
            <p className="text-[8pt] text-blue-800">{rfq.notes}</p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-[8pt] font-bold text-gray-500">Issued By: <span className="text-gray-900 font-normal">{settings.name} Procurement Dept.</span></p>
            <p className="text-[7pt] text-gray-400">Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
          </div>

          <div className="text-right w-48 border-t border-gray-400 pt-2">
            <p className="text-[8pt] font-black uppercase text-gray-700">Authorized Signature</p>
            <p className="text-[7pt] text-gray-400">Procurement Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
}
