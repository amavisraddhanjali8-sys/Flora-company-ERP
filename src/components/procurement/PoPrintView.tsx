import React from 'react';
import { ProcurementOrder, CompanySettings, Supplier } from '../../types';
import { formatCurrency } from '../../lib/utils';

interface PoPrintViewProps {
  po: ProcurementOrder;
  settings: CompanySettings;
  suppliers: Supplier[];
}

export default function PoPrintView({ po, settings, suppliers }: PoPrintViewProps) {
  const supplier = suppliers.find(s => s.id === po.supplierId);

  return (
    <div className="bg-white w-full h-full text-[10pt] font-sans leading-tight flex flex-col p-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .print-hidden { display: none !important; }
        }
      `}} />

      {/* Header Table */}
      <table className="w-full border-collapse mb-6 border-b-2 border-indigo-600 pb-4">
        <tbody>
          <tr>
            <td className="align-top">
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-white flex items-center justify-center text-white font-black text-2xl rounded shadow-sm border border-gray-100 overflow-hidden">
                  {settings.logo ? (
                    <img src={settings.logo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white">
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
                  {settings.taxId && <p className="text-gray-900 text-[8pt] font-black uppercase mt-1">TAX ID: {settings.taxId}</p>}
                </div>
              </div>
            </td>
            <td className="align-top text-right">
              <h2 className="text-3xl font-black text-indigo-900 uppercase tracking-wider mb-1 leading-none">PURCHASE ORDER</h2>
              <p className="text-[9pt] font-bold text-indigo-600 uppercase mb-2">OFFICIAL PO DOCUMENT</p>
              <div className="space-y-0.5 text-[9pt]">
                <p className="text-gray-500 font-bold uppercase tracking-wider">PO Number: <span className="text-gray-900 font-mono font-bold ml-2">{po.poNumber}</span></p>
                <p className="text-gray-500 font-bold uppercase tracking-wider">PO Date: <span className="text-gray-900 ml-2">{new Date(po.date).toLocaleDateString()}</span></p>
                {po.deliveryDate && (
                  <p className="text-gray-500 font-bold uppercase tracking-wider">Expected Delivery: <span className="text-emerald-700 font-bold ml-2">{new Date(po.deliveryDate).toLocaleDateString()}</span></p>
                )}
                {po.orderNumber && (
                  <p className="text-gray-500 font-bold uppercase tracking-wider">Client Order Ref: <span className="text-indigo-600 font-bold ml-2">{po.orderNumber}</span></p>
                )}
                <p className="text-gray-500 font-bold uppercase tracking-wider">PO Type: <span className="text-gray-900 ml-2">{po.type || 'Material'}</span></p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Supplier & Delivery Info */}
      <table className="w-full border-collapse mb-6">
        <tbody>
          <tr>
            <td className="w-1/2 pr-3 align-top">
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 h-full">
                <h3 className="text-[7pt] font-black text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-200 pb-1">Vendor / Supplier Details:</h3>
                <div className="space-y-0.5">
                  <p className="font-black text-gray-900 text-[10pt]">{po.supplierName}</p>
                  {supplier ? (
                    <>
                      <p className="text-gray-600 text-[8pt]">Attn: {supplier.contactPerson}</p>
                      <p className="text-gray-600 text-[8pt]">Phone: {supplier.phone}</p>
                      <p className="text-gray-600 text-[8pt]">Email: {supplier.email}</p>
                      <p className="text-gray-500 text-[8pt]">{supplier.address}</p>
                      {supplier.taxId && <p className="text-gray-700 text-[8pt] font-bold">Tax ID: {supplier.taxId}</p>}
                    </>
                  ) : (
                    <p className="text-gray-500 text-[8pt] italic">Supplier ID: {po.supplierId}</p>
                  )}
                </div>
              </div>
            </td>
            <td className="w-1/2 pl-3 align-top">
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 h-full">
                <h3 className="text-[7pt] font-black text-gray-400 uppercase tracking-widest mb-1.5 border-b border-gray-200 pb-1">Ship To & Receiving Address:</h3>
                <div className="space-y-0.5 text-[8pt]">
                  <p className="font-bold text-gray-900">{settings.name} - Central Warehouse / Receiving</p>
                  <p className="text-gray-600">{settings.address}</p>
                  <p className="text-gray-600 font-bold">Receiving Contact: <span className="font-normal">{settings.phones[0] || 'N/A'}</span></p>
                  <p className="text-gray-600 font-bold">Payment Status: <span className="px-2 py-0.5 rounded text-[8pt] font-bold bg-amber-100 text-amber-800">{po.paymentStatus}</span></p>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items Table */}
      <div className="flex-1">
        <table className="w-full border-collapse mb-4 text-[9pt]">
          <thead>
            <tr className="bg-indigo-950 text-white">
              <th className="px-3 py-2 text-left font-bold uppercase tracking-wider rounded-tl-lg w-10">#</th>
              <th className="px-3 py-2 text-left font-bold uppercase tracking-wider">Item / Service Description</th>
              <th className="px-3 py-2 text-center font-bold uppercase tracking-wider w-20">Qty</th>
              <th className="px-3 py-2 text-right font-bold uppercase tracking-wider w-28">Unit Price</th>
              <th className="px-3 py-2 text-right font-bold uppercase tracking-wider w-28 rounded-tr-lg">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 border-x border-b border-gray-200 rounded-b-lg overflow-hidden">
            {po.items.map((item, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 py-2 font-bold text-gray-400">{i + 1}</td>
                <td className="px-3 py-2">
                  <p className="font-bold text-gray-900">{item.name}</p>
                </td>
                <td className="px-3 py-2 text-center font-bold text-gray-800">
                  {item.quantity} {item.unit || ''}
                </td>
                <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                <td className="px-3 py-2 text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals Section */}
      <div className="flex justify-between items-start gap-6 mb-6">
        <div className="flex-1 space-y-2">
          <h4 className="text-[8pt] font-black uppercase tracking-wider text-gray-400 border-b border-gray-200 pb-1">PO Terms & Instructions:</h4>
          <ul className="list-disc list-inside text-[8pt] text-gray-600 space-y-0.5">
            <li>Delivery must be made according to specified dates and location.</li>
            <li>Invoices must reference PO Number <span className="font-mono font-bold text-gray-900">{po.poNumber}</span>.</li>
            <li>All goods subject to quality inspection upon receipt.</li>
          </ul>
        </div>

        <div className="w-72 bg-gray-50 rounded-xl p-3.5 border border-gray-200 space-y-1.5 text-[9pt]">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span className="font-bold text-gray-900">{formatCurrency(po.subtotal || po.total)}</span>
          </div>
          {po.discount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount:</span>
              <span className="font-bold">-{formatCurrency(po.discount)}</span>
            </div>
          )}
          {po.tax > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax / VAT:</span>
              <span className="font-bold">{formatCurrency(po.tax)}</span>
            </div>
          )}
          {po.freight > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Freight / Shipping:</span>
              <span className="font-bold">{formatCurrency(po.freight)}</span>
            </div>
          )}
          {po.otherCharges > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Other Charges:</span>
              <span className="font-bold">{formatCurrency(po.otherCharges)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-indigo-950 border-t border-gray-300 pt-2 mt-1">
            <span>Total PO Value:</span>
            <span>{formatCurrency(po.total)}</span>
          </div>
        </div>
      </div>

      {/* Signature Footer */}
      <div className="pt-4 border-t border-gray-200 flex justify-between items-end">
        <div>
          <p className="text-[8pt] font-bold text-gray-600">Authorized Purchasing Department</p>
          <p className="text-[7pt] text-gray-400">{settings.name}</p>
        </div>

        <div className="text-right w-48 border-t border-gray-400 pt-2">
          <p className="text-[8pt] font-black uppercase text-gray-800">Approved Purchase Officer</p>
          <p className="text-[7pt] text-gray-400">Date: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
