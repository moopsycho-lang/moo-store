// src/client/components/InvoiceModal.tsx
// Printable receipt / commercial packing slip invoice for customers and store fulfillment

import React from 'react';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import type { Order } from '../../types/index.ts';

interface InvoiceModalProps {
  order: Order | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-3xl bg-white text-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden my-8 print:border-none print:shadow-none print:m-0 print:w-full print:max-w-none">
        {/* Actions bar (hidden during print) */}
        <div className="px-6 py-4 bg-neutral-100 border-b border-neutral-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">Official Invoice</span>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-neutral-200 rounded">
              {order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Document Body */}
        <div className="p-8 space-y-8 bg-white" id="printable-invoice">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-neutral-900 text-white text-xl font-black px-2 py-0.5 rounded tracking-normal">
                  MOO
                </span>
                <span className="text-lg font-bold tracking-tight text-neutral-900">Modern Objects & Living</span>
              </div>
              <p className="text-xs text-neutral-500">452 Broadway · New York, NY 10013</p>
              <p className="text-xs text-neutral-500">support@moo.store · www.moo.store</p>
            </div>

            <div className="text-right">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 uppercase">Commercial Invoice</h2>
              <p className="text-xs font-mono text-neutral-600 mt-1">Invoice #: {order.orderNumber}</p>
              <p className="text-xs text-neutral-500">
                Date: {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mt-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{order.paymentStatus === 'PAID' ? 'Payment Confirmed' : 'Payment: Cash on Delivery'}</span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div>
              <h4 className="font-bold text-neutral-500 uppercase tracking-wider mb-2">Billed & Shipped To</h4>
              <p className="font-semibold text-neutral-900 text-sm">{order.shippingAddress.fullName}</p>
              <p className="text-neutral-600">{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p className="text-neutral-600">{order.shippingAddress.line2}</p>}
              <p className="text-neutral-600">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
              <p className="text-neutral-600">{order.shippingAddress.country}</p>
              <p className="text-neutral-500 mt-1">{order.customerEmail}</p>
            </div>

            <div className="space-y-1.5 border-l border-neutral-100 pl-6">
              <h4 className="font-bold text-neutral-500 uppercase tracking-wider mb-2">Fulfillment Details</h4>
              <p><span className="text-neutral-500">Payment Method:</span> <strong className="font-semibold">{order.paymentMethod === 'STRIPE' ? 'Stripe Credit Card' : 'Cash on Delivery (COD)'}</strong></p>
              <p><span className="text-neutral-500">Order Status:</span> <strong className="font-semibold uppercase font-mono">{order.status}</strong></p>
              {order.trackingNumber && (
                <p><span className="text-neutral-500">Tracking Number:</span> <strong className="font-mono">{order.trackingNumber}</strong></p>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-neutral-200 text-neutral-500 uppercase font-bold tracking-wider">
                <th className="py-2.5">Item Description</th>
                <th className="py-2.5 text-right font-mono">Unit Price</th>
                <th className="py-2.5 text-center font-mono">Qty</th>
                <th className="py-2.5 text-right font-mono">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {order.items.map((item, idx) => (
                <tr key={idx} className="text-neutral-800">
                  <td className="py-3 font-medium">
                    <p className="text-neutral-900 font-semibold">{item.name}</p>
                  </td>
                  <td className="py-3 text-right font-mono tabular-nums">${item.price.toFixed(2)}</td>
                  <td className="py-3 text-center font-mono tabular-nums">{item.quantity}</td>
                  <td className="py-3 text-right font-mono font-semibold tabular-nums">
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary Math */}
          <div className="flex justify-end pt-4 border-t border-neutral-200">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums font-semibold">${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600">
                <span>Tax (8%)</span>
                <span className="font-mono tabular-nums">${order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span className="font-mono tabular-nums">
                  {order.shippingCost === 0 ? 'FREE' : `$${order.shippingCost.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-neutral-900 border-t-2 border-neutral-900 pt-2">
                <span>Grand Total</span>
                <span className="font-mono tabular-nums">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-6 border-t border-neutral-100 text-[11px] text-neutral-400 text-center">
            Thank you for choosing MOO. If you have any inquiries regarding this order, please contact support@moo.store.
          </div>
        </div>
      </div>
    </div>
  );
};
