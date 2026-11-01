// src/client/pages/OrderConfirmationPage.tsx
// Post-checkout success screen with live order tracking timeline and printable invoice trigger

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Printer, ArrowRight, Package, Truck, Clock } from 'lucide-react';
import { InvoiceModal } from '../components/InvoiceModal.tsx';
import type { Order } from '../../types/index.ts';

interface OrderConfirmationPageProps {
  orderNumber: string;
  onNavigate: (view: string, param?: string) => void;
}

export const OrderConfirmationPage: React.FC<OrderConfirmationPageProps> = ({ orderNumber, onNavigate }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${orderNumber}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        setOrder(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center text-xs text-neutral-400">
        Locating order receipt...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Order Reference Not Found</h2>
        <p className="text-xs text-neutral-500">Could not find order with reference {orderNumber}.</p>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 bg-neutral-900 text-white rounded-xl text-xs font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Success Card Header */}
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
              Order Confirmed & Received
            </h1>
            <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
              Thank you for shopping with MOO. We have dispatched a confirmation email to{' '}
              <strong className="text-neutral-900 dark:text-white">{order.customerEmail}</strong>.
            </p>
          </div>

          <div className="inline-flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 px-4 py-2 rounded-xl text-xs font-mono">
            <span className="text-neutral-500">Order Number:</span>
            <span className="font-bold text-neutral-900 dark:text-white">{order.orderNumber}</span>
          </div>

          <div className="pt-2 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setIsInvoiceOpen(true)}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Invoice</span>
            </button>
            <button
              onClick={() => onNavigate('account')}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <span>View In Account History</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Timeline Tracker */}
        <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Fulfillment & Tracking Timeline
              </h3>
            </div>
            {order.trackingNumber && (
              <span className="text-xs font-mono text-neutral-500">Carrier Track: {order.trackingNumber}</span>
            )}
          </div>

          {/* Timeline steps */}
          <div className="space-y-4">
            {order.timeline.map((event, idx) => (
              <div key={idx} className="flex items-start gap-4 text-xs">
                <div className="w-6 h-6 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shrink-0 font-bold text-[10px]">
                  ✓
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold uppercase tracking-wide text-neutral-900 dark:text-white">
                      {event.status}
                    </span>
                    <span className="font-mono text-neutral-400 text-[11px]">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">{event.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Purchased Items & Delivery Address */}
        <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white pb-3 border-b border-neutral-100 dark:border-neutral-800">
            Parcel Overview
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
            <div>
              <p className="font-bold text-neutral-500 uppercase tracking-wider mb-1">Destination Address</p>
              <p className="font-semibold text-neutral-900 dark:text-white">{order.shippingAddress.fullName}</p>
              <p className="text-neutral-600 dark:text-neutral-400">{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p className="text-neutral-600 dark:text-neutral-400">{order.shippingAddress.line2}</p>}
              <p className="text-neutral-600 dark:text-neutral-400">
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
            </div>

            <div>
              <p className="font-bold text-neutral-500 uppercase tracking-wider mb-1">Payment Method</p>
              <p className="font-semibold text-neutral-900 dark:text-white">
                {order.paymentMethod === 'STRIPE' ? 'Stripe Credit Card (Authorized)' : 'Cash on Delivery (Pending)'}
              </p>
              <p className="text-neutral-500 mt-2 font-mono tabular-nums">
                Total Charged: <strong>${order.total.toFixed(2)}</strong>
              </p>
            </div>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border-t border-neutral-100 dark:border-neutral-800 pt-4">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-2.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-neutral-900 dark:text-white">{item.name}</p>
                  <p className="text-[11px] text-neutral-400">Quantity: {item.quantity}</p>
                </div>
                <span className="font-mono tabular-nums font-bold text-neutral-900 dark:text-white">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <InvoiceModal order={order} onClose={() => setIsInvoiceOpen(false)} />
    </>
  );
};
