// src/client/components/WishlistDrawer.tsx
import React, { useEffect, useState } from 'react';
import { X, Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import type { Product } from '../../types/index.ts';

interface WishlistDrawerProps {
  onSelectProduct: (slug: string) => void;
}

export const WishlistDrawer: React.FC<WishlistDrawerProps> = ({ onSelectProduct }) => {
  const { savedIds, isWishlistOpen, setIsWishlistOpen, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isWishlistOpen || savedIds.length === 0) {
      setProducts([]);
      return;
    }

    setLoading(true);
    // Fetch products for all saved IDs
    Promise.all(savedIds.map(id => fetch(`/api/products/${id}`).then(r => (r.ok ? r.json() : null))))
      .then(res => setProducts(res.filter(Boolean)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isWishlistOpen, savedIds]);

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={() => setIsWishlistOpen(false)}
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-neutral-900 shadow-2xl flex flex-col border-l border-neutral-200 dark:border-neutral-800 animate-in slide-in-from-right duration-300">
          <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Your Saved Wishlist</h2>
              <span className="text-xs font-mono px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded-full">
                {savedIds.length}
              </span>
            </div>
            <button
              onClick={() => setIsWishlistOpen(false)}
              className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loading ? (
              <div className="py-20 text-center text-xs text-neutral-400">Loading saved items...</div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                  <Heart className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-neutral-900 dark:text-white">Your wishlist is empty</p>
                <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                  Click the heart icon on any product to save items you love for later.
                </p>
              </div>
            ) : (
              products.map(p => (
                <div
                  key={p.id}
                  className="flex gap-4 p-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/60 dark:border-neutral-800"
                >
                  <img
                    src={p.images[0]?.url || '/src/assets/images/moo_category_home_1793502193419.jpg'}
                    alt={p.name}
                    className="w-16 h-16 object-cover rounded-lg bg-white dark:bg-neutral-900 shrink-0 cursor-pointer"
                    onClick={() => {
                      setIsWishlistOpen(false);
                      onSelectProduct(p.slug);
                    }}
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4
                        onClick={() => {
                          setIsWishlistOpen(false);
                          onSelectProduct(p.slug);
                        }}
                        className="text-xs font-semibold text-neutral-900 dark:text-white truncate cursor-pointer hover:underline"
                      >
                        {p.name}
                      </h4>
                      <p className="text-xs font-mono font-bold tabular-nums text-neutral-900 dark:text-white mt-1">
                        ${p.price.toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <button
                        onClick={() => {
                          addToCart(p.id);
                          toggleWishlist(p.id);
                        }}
                        className="px-3 py-1 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Move to Bag
                      </button>
                      <button
                        onClick={() => toggleWishlist(p.id)}
                        className="text-neutral-400 hover:text-rose-500 transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
