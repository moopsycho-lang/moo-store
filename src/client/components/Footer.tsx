// src/client/components/Footer.tsx
import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Clock } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string, param?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-white border-t border-neutral-200 dark:bg-neutral-950 dark:border-neutral-900 transition-colors">
      {/* Trust & Guarantee Markers */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-b border-neutral-100 dark:border-neutral-900">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Truck className="w-5 h-5 text-neutral-800 dark:text-neutral-200 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Free Domestic Shipping</h4>
              <p className="text-xs text-neutral-500 mt-0.5">On all orders over $75 with carbon-neutral transit</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <RotateCcw className="w-5 h-5 text-neutral-800 dark:text-neutral-200 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">30-Day Fair Returns</h4>
              <p className="text-xs text-neutral-500 mt-0.5">Prepaid return labels and frictionless refunds</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-neutral-800 dark:text-neutral-200 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Secure Checkout</h4>
              <p className="text-xs text-neutral-500 mt-0.5">Stripe encrypted cards & Cash-on-Delivery options</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-neutral-800 dark:text-neutral-200 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Lifetime Quality</h4>
              <p className="text-xs text-neutral-500 mt-0.5">Engineered with honest materials built to age gracefully</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-1.5">
              <span className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-0.5 rounded text-sm font-black">
                MOO
              </span>
              <span className="text-base font-bold text-neutral-900 dark:text-white">Living & Studio Essentials</span>
            </div>
            <p className="text-xs text-neutral-500 max-w-sm leading-relaxed">
              We design and curate timeless functional objects, furniture, audio equipment, and everyday staples that bring clarity, calm, and utility to your life.
            </p>
            <div className="text-xs text-neutral-400 font-mono">
              <span>support@moo.store</span>
              <span className="mx-2">·</span>
              <span>+1 (800) 555-0199</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3">Explore</h4>
            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  All Products
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('category', 'home-living')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Home & Living
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('category', 'tech-workspace')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Tech & Workspace
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('category', 'apparel-accessories')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Apparel & Goods
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('category', 'wellness-care')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Wellness & Care
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3">Customer Service</h4>
            <ul className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <li>
                <button onClick={() => onNavigate('account')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Track Your Order
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('account')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Returns & Refunds
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('account')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                  Saved Addresses
                </button>
              </li>
              <li>
                <span className="text-neutral-400">Shipping Policies</span>
              </li>
              <li>
                <span className="text-neutral-400">FAQ & Contact</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white mb-3">Store Administration</h4>
            <p className="text-xs text-neutral-500 mb-3">Store managers and administrators can sign in to manage inventory, fulfill orders, and moderate reviews.</p>
            <button
              onClick={() => onNavigate('admin')}
              className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Open Admin Portal
            </button>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-100 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-4">
          <p>© 2026 MOO Store Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span>Stripe Verified</span>
            <span>·</span>
            <span>Cash on Delivery</span>
            <span>·</span>
            <span>SSL 256-Bit</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
