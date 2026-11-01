// src/client/pages/CheckoutPage.tsx
// Seamless 3-step checkout with address selection, shipping zones, Stripe test card simulation, and COD

import React, { useState, useEffect } from 'react';
import { ShieldCheck, CreditCard, Banknote, ArrowLeft, Check, Lock, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import type { Address, ShippingZone } from '../../types/index.ts';

interface CheckoutPageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onNavigate }) => {
  const { cart, clearCart } = useCart();
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string>('sz-us');
  const [paymentMethod, setPaymentMethod] = useState<'STRIPE' | 'CASH_ON_DELIVERY'>('STRIPE');

  // Form State
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [phone, setPhone] = useState('');
  const [selectedSavedAddrId, setSelectedSavedAddrId] = useState<string>('');

  // Stripe Test Card Details
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExp, setCardExp] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('888');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved addresses and shipping zones
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(d => {
        if (d.shippingZones) setShippingZones(d.shippingZones);
      })
      .catch(() => {});

    if (accessToken) {
      fetch('/api/user/addresses', {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then(r => (r.ok ? r.json() : []))
        .then(addrs => {
          setSavedAddresses(addrs || []);
          const def = addrs?.find((a: Address) => a.isDefault) || addrs?.[0];
          if (def) {
            setSelectedSavedAddrId(def.id);
            setCustomerName(def.fullName);
            setAddressLine1(def.line1);
            setAddressLine2(def.line2 || '');
            setCity(def.city);
            setState(def.state);
            setPostalCode(def.postalCode);
            setCountry(def.country);
            if (def.phone) setPhone(def.phone);
          }
        })
        .catch(() => {});
    }
  }, [accessToken]);

  const handleSelectSavedAddress = (addr: Address) => {
    setSelectedSavedAddrId(addr.id);
    setCustomerName(addr.fullName);
    setAddressLine1(addr.line1);
    setAddressLine2(addr.line2 || '');
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setCountry(addr.country);
    if (addr.phone) setPhone(addr.phone);
  };

  const handleFillTestCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setCardExp('12/28');
    setCardCvc('888');
    showToast('Stripe Test Card Loaded', 'info');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) {
      showToast('Your bag is empty', 'error');
      return;
    }

    if (!customerEmail || !customerName || !addressLine1 || !city || !state || !postalCode) {
      showToast('Please fill out all required address fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        customerName,
        customerEmail,
        shippingAddress: {
          fullName: customerName,
          phone,
          line1: addressLine1,
          line2: addressLine2,
          city,
          state,
          postalCode,
          country,
        },
        items: cart.items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
          name: i.variant ? `${i.product.name} (${i.variant.name})` : i.product.name,
          price: i.price,
          quantity: i.quantity,
          image: i.product.images[0]?.url,
        })),
        shippingZoneId: selectedZoneId,
        couponCode: cart.coupon?.code,
        paymentMethod,
        paymentDetails: paymentMethod === 'STRIPE' ? { cardNumber, expDate: cardExp, cvv: cardCvc } : undefined,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to place order', 'error');
        setIsSubmitting(false);
        return;
      }

      await clearCart();
      showToast('Order confirmed successfully!', 'success');
      onNavigate('order-confirmation', data.orderNumber);
    } catch (err) {
      console.error('Order error:', err);
      showToast('Network error during checkout', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Your Shopping Bag is Empty</h2>
        <p className="text-xs text-neutral-500">Please select objects before attempting to checkout.</p>
        <button
          onClick={() => onNavigate('catalog')}
          className="px-5 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
        >
          Return to Catalogue
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <button onClick={() => onNavigate('catalog')} className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Shopping</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Checkout Steps */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-7 space-y-8">
          {/* Step 1: Customer & Shipping Address */}
          <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center font-mono">
                  1
                </span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Contact & Shipping Address
                </h3>
              </div>
              {!user && (
                <span className="text-xs text-neutral-500">Guest Checkout</span>
              )}
            </div>

            {/* Saved address selector if logged in */}
            {savedAddresses.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Select from Saved Addresses
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {savedAddresses.map(addr => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => handleSelectSavedAddress(addr)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        selectedSavedAddrId === addr.id
                          ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800'
                          : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex justify-between items-center font-semibold text-neutral-900 dark:text-white">
                        <span>{addr.fullName}</span>
                        {selectedSavedAddrId === addr.id && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <p className="text-neutral-500 truncate mt-0.5">{addr.line1}, {addr.city}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                value={addressLine1}
                onChange={e => setAddressLine1(e.target.value)}
                placeholder="123 Studio Way"
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Apartment, Suite, Unit (Optional)
              </label>
              <input
                type="text"
                value={addressLine2}
                onChange={e => setAddressLine2(e.target.value)}
                placeholder="Apt 4B"
                className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">State / Prov *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={e => setState(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Postal Code *</label>
                <input
                  type="text"
                  required
                  value={postalCode}
                  onChange={e => setPostalCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Shipping Method Selection */}
          <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <span className="w-6 h-6 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center font-mono">
                2
              </span>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                Shipping Carrier & Transit Speed
              </h3>
            </div>

            <div className="space-y-2">
              <label
                onClick={() => setSelectedZoneId('sz-us')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedZoneId === 'sz-us'
                    ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={selectedZoneId === 'sz-us'}
                    onChange={() => setSelectedZoneId('sz-us')}
                    className="accent-neutral-900 dark:accent-white"
                  />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">Domestic Standard (3-5 business days)</p>
                    <p className="text-[11px] text-neutral-500">Tracked ground delivery with carbon offset</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold">
                  {cart.subtotal >= 75 ? 'FREE' : '$8.00'}
                </span>
              </label>

              <label
                onClick={() => setSelectedZoneId('sz-us-exp')}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  selectedZoneId === 'sz-us-exp'
                    ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shipping"
                    checked={selectedZoneId === 'sz-us-exp'}
                    onChange={() => setSelectedZoneId('sz-us-exp')}
                    className="accent-neutral-900 dark:accent-white"
                  />
                  <div>
                    <p className="text-xs font-bold text-neutral-900 dark:text-white">Domestic Priority Air (2 business days)</p>
                    <p className="text-[11px] text-neutral-500">Expedited air parcel with signature verification</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold">$18.00</span>
              </label>
            </div>
          </div>

          {/* Step 3: Payment Method */}
          <div className="bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-bold flex items-center justify-center font-mono">
                  3
                </span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
                  Payment Method
                </h3>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-neutral-500">
                <Lock className="w-3 h-3" />
                <span>256-bit Encrypted</span>
              </div>
            </div>

            {/* Payment Mode Selector */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('STRIPE')}
                className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                  paymentMethod === 'STRIPE'
                    ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <CreditCard className="w-5 h-5 text-neutral-900 dark:text-white" />
                <div className="text-left">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">Credit Card (Stripe)</p>
                  <p className="text-[11px] text-neutral-500">Instant test authorization</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                  paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-800'
                    : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300'
                }`}
              >
                <Banknote className="w-5 h-5 text-neutral-900 dark:text-white" />
                <div className="text-left">
                  <p className="text-xs font-bold text-neutral-900 dark:text-white">Cash on Delivery</p>
                  <p className="text-[11px] text-neutral-500">Pay upon parcel arrival</p>
                </div>
              </button>
            </div>

            {/* Credit Card inputs if Stripe */}
            {paymentMethod === 'STRIPE' ? (
              <div className="p-4 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Stripe Card Details</span>
                  <button
                    type="button"
                    onClick={handleFillTestCard}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Fill Test Card</span>
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="Card Number"
                    className="w-full px-3.5 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={cardExp}
                    onChange={e => setCardExp(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3.5 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value)}
                    placeholder="CVC"
                    className="w-full px-3.5 py-2 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-semibold">Cash on Delivery Terms:</p>
                <p className="text-[11px]">
                  Please have the exact amount ready upon courier delivery. An automated SMS verification will be sent to confirm receipt prior to driver dispatch.
                </p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-sm font-bold rounded-xl transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? 'Authorizing & Confirming...' : `Authorize & Place Order ($${cart.total.toFixed(2)})`}</span>
          </button>
        </form>

        {/* Right Column: Order Summary Sidebar */}
        <div className="lg:col-span-5 bg-white dark:bg-neutral-900 p-6 sm:p-8 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-6 lg:sticky lg:top-24">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white pb-3 border-b border-neutral-100 dark:border-neutral-800">
            Order Review ({cart.items.length} items)
          </h3>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {cart.items.map(item => (
              <div key={item.id} className="flex gap-3 text-xs">
                <img
                  src={item.product.images[0]?.url || '/src/assets/images/moo_category_home_1793502193419.jpg'}
                  alt={item.product.name}
                  className="w-12 h-12 rounded-lg object-cover bg-neutral-100 dark:bg-neutral-800 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-neutral-900 dark:text-white truncate">{item.product.name}</p>
                  {item.variant && <p className="text-[11px] text-neutral-500">{item.variant.name}</p>}
                  <p className="text-neutral-400 text-[11px]">Qty: {item.quantity}</p>
                </div>
                <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing Math */}
          <div className="space-y-2 text-xs border-t border-neutral-100 dark:border-neutral-800 pt-4 text-neutral-600 dark:text-neutral-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums text-neutral-900 dark:text-white font-semibold">
                ${cart.subtotal.toFixed(2)}
              </span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>Discount ({cart.coupon?.code})</span>
                <span className="font-mono tabular-nums">-${cart.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Estimated Tax (8%)</span>
              <span className="font-mono tabular-nums text-neutral-900 dark:text-white">
                ${cart.tax.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="font-mono tabular-nums text-neutral-900 dark:text-white">
                {cart.shipping === 0 ? 'FREE' : `$${cart.shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-neutral-900 dark:text-white border-t border-neutral-200 dark:border-neutral-800 pt-3">
              <span>Total Amount</span>
              <span className="font-mono tabular-nums">${cart.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
