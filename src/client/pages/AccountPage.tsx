// src/client/pages/AccountPage.tsx
// Customer account management with order history, live timelines, reorder, and address book

import React, { useEffect, useState } from 'react';
import { Package, MapPin, User, Printer, RotateCcw, Plus, Trash2, Edit3, ArrowRight, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { InvoiceModal } from '../components/InvoiceModal.tsx';
import type { Order, Address } from '../../types/index.ts';

interface AccountPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ onNavigate }) => {
  const { user, accessToken, logout, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'orders' | 'addresses' | 'profile'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  // Invoice modal state
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<Order | null>(null);

  // Return request modal state
  const [returnOrder, setReturnOrder] = useState<Order | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addrFullName, setAddrFullName] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrPostalCode, setAddrPostalCode] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch('/api/orders', { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => (r.ok ? r.json() : [])),
      fetch('/api/user/addresses', { headers: { Authorization: `Bearer ${accessToken}` } }).then(r => (r.ok ? r.json() : [])),
    ])
      .then(([ordersData, addrsData]) => {
        setOrders(ordersData || []);
        setAddresses(addrsData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Sign In to View Your Account</h2>
        <p className="text-xs text-neutral-500">
          Track orders, access saved addresses, and manage your preferences.
        </p>
        <button
          onClick={() => {
            setAuthModalMode('signin');
            setIsAuthModalOpen(true);
          }}
          className="px-6 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleReorder = async (order: Order) => {
    try {
      const res = await fetch(`/api/orders/${order.id}/reorder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Items added back to your bag!', 'success');
        setIsCartOpen(true);
      }
    } catch {
      showToast('Failed to reorder', 'error');
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrder) return;
    setIsSubmittingReturn(true);
    try {
      const res = await fetch(`/api/orders/${returnOrder.id}/return-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason: returnReason }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setReturnOrder(null);
        setReturnReason('');
        // Refresh orders
        const ordRes = await fetch('/api/orders', { headers: { Authorization: `Bearer ${accessToken}` } });
        if (ordRes.ok) setOrders(await ordRes.json());
      } else {
        showToast(data.error || 'Failed to submit return request', 'error');
      }
    } catch {
      showToast('Error submitting return request', 'error');
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/user/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          fullName: addrFullName,
          line1: addrLine1,
          line2: addrLine2,
          city: addrCity,
          state: addrState,
          postalCode: addrPostalCode,
          phone: addrPhone,
          isDefault: addrIsDefault,
        }),
      });
      if (res.ok) {
        showToast('Address saved', 'success');
        setIsAddressModalOpen(false);
        const addrs = await fetch('/api/user/addresses', { headers: { Authorization: `Bearer ${accessToken}` } });
        setAddresses(await addrs.json());
      }
    } catch {
      showToast('Error saving address', 'error');
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        setAddresses(prev => prev.filter(a => a.id !== id));
        showToast('Address removed', 'info');
      }
    } catch {
      showToast('Could not delete address', 'error');
    }
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Profile Banner */}
        <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{user.name}</h1>
              {user.role === 'ADMIN' && (
                <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 rounded-md font-semibold">
                  Administrator
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">{user.email} · Member since {new Date(user.createdAt).getFullYear()}</p>
          </div>

          <div className="flex items-center gap-2">
            {user.role === 'ADMIN' && (
              <button
                onClick={() => onNavigate('admin')}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Store Admin Portal
              </button>
            )}
            <button
              onClick={logout}
              className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Order History ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('addresses')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'addresses'
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Address Book ({addresses.length})</span>
          </button>
        </div>

        {/* Tab 1: Orders History */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="p-12 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-center space-y-3">
                <Package className="w-8 h-8 mx-auto text-neutral-400" />
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">No Orders Placed Yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  When you purchase items, their live fulfillment timelines and invoices will appear here.
                </p>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="mt-2 px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
                >
                  Start Exploring
                </button>
              </div>
            ) : (
              orders.map(order => (
                <div
                  key={order.id}
                  className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 p-6 sm:p-8 space-y-6 shadow-xs"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-bold text-neutral-900 dark:text-white">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[11px] font-mono uppercase font-bold px-2 py-0.5 rounded ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                              : order.status === 'REFUNDED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200'
                              : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedInvoiceOrder(order)}
                        className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Invoice</span>
                      </button>
                      <button
                        onClick={() => handleReorder(order)}
                        className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reorder Items</span>
                      </button>
                      {order.status === 'DELIVERED' && (
                        <button
                          onClick={() => setReturnOrder(order)}
                          className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg text-xs font-semibold hover:border-neutral-400"
                        >
                          Request Return
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          {item.image && (
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-neutral-100 dark:bg-neutral-800" />
                          )}
                          <div>
                            <p className="font-semibold text-neutral-900 dark:text-white">{item.name}</p>
                            <p className="text-neutral-400 text-[11px]">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Timeline Accordion Snippet */}
                  <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Live Timeline</p>
                    <div className="space-y-1.5">
                      {order.timeline.map((t, idx) => (
                        <div key={idx} className="text-xs flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                          <span className="font-medium text-neutral-900 dark:text-white">• {t.status}: {t.note}</span>
                          <span className="text-[11px] font-mono text-neutral-400">{new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total summary */}
                  <div className="flex justify-between items-center pt-2 text-xs font-semibold text-neutral-900 dark:text-white border-t border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-500">Total Charged ({order.paymentMethod === 'STRIPE' ? 'Stripe Card' : 'COD'})</span>
                    <span className="font-mono text-sm tabular-nums">${order.total.toFixed(2)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Addresses */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">Saved Addresses</h3>
                <p className="text-xs text-neutral-500">Manage multiple addresses for faster checkout.</p>
              </div>
              <button
                onClick={() => {
                  setAddrFullName(user.name);
                  setAddrLine1('');
                  setAddrLine2('');
                  setAddrCity('');
                  setAddrState('');
                  setAddrPostalCode('');
                  setAddrPhone('');
                  setAddrIsDefault(addresses.length === 0);
                  setIsAddressModalOpen(true);
                }}
                className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add New Address</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-2 relative"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">{addr.fullName}</p>
                      {addr.isDefault && (
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full font-semibold">
                          Default Address
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      className="text-neutral-400 hover:text-rose-500 transition-colors p-1"
                      aria-label="Delete address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {addr.line1} {addr.line2 && `· ${addr.line2}`}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    {addr.city}, {addr.state} {addr.postalCode} · {addr.country}
                  </p>
                  {addr.phone && <p className="text-xs text-neutral-500 font-mono">{addr.phone}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      <InvoiceModal order={selectedInvoiceOrder} onClose={() => setSelectedInvoiceOrder(null)} />

      {/* Return Request Modal */}
      {returnOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              Request Return for {returnOrder.orderNumber}
            </h3>
            <p className="text-xs text-neutral-500">
              Our support team will generate a prepaid shipping return label upon approval.
            </p>
            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Reason for return
                </label>
                <textarea
                  required
                  rows={3}
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  placeholder="Please describe why you are requesting a return or exchange..."
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnOrder(null)}
                  className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Add Delivery Address</h3>
            <form onSubmit={handleSaveAddress} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={addrFullName}
                  onChange={e => setAddrFullName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={addrLine1}
                  onChange={e => setAddrLine1(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={addrCity}
                    onChange={e => setAddrCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={addrState}
                    onChange={e => setAddrState(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Postal Code</label>
                <input
                  type="text"
                  required
                  value={addrPostalCode}
                  onChange={e => setAddrPostalCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 font-mono"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="def-check"
                  checked={addrIsDefault}
                  onChange={e => setAddrIsDefault(e.target.checked)}
                />
                <label htmlFor="def-check" className="text-xs text-neutral-700 dark:text-neutral-300">Set as default shipping address</label>
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 text-xs text-neutral-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
