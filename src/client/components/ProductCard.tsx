// src/client/components/ProductCard.tsx
// High-fidelity product card with zero-pill discipline, tabular price numbers, and quick actions

import React from 'react';
import { Heart, Plus, Star } from 'lucide-react';
import type { Product } from '../../types/index.ts';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';

interface ProductCardProps {
  product: Product;
  onSelect: (slug: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isSaved } = useWishlist();

  const saved = isSaved(product.id);
  const primaryImage = product.images[0]?.url || '/src/assets/images/moo_category_home_1793502193419.jpg';
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product.id);
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  return (
    <div
      onClick={() => onSelect(product.slug)}
      className="group cursor-pointer flex flex-col bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Product Image Slot */}
      <div className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          className="absolute top-3 right-3 p-2 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm text-neutral-700 dark:text-neutral-200 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shadow-sm"
        >
          <Heart className={`w-4 h-4 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Stock / Sale Notice (Single quiet label, never pill cluster) */}
        {product.stock <= 5 && product.stock > 0 ? (
          <div className="absolute top-3 left-3 text-[11px] font-medium tracking-wide bg-amber-500/90 text-white backdrop-blur-sm px-2 py-0.5 rounded">
            Only {product.stock} left
          </div>
        ) : hasDiscount ? (
          <div className="absolute top-3 left-3 text-[11px] font-medium tracking-wide bg-neutral-900/90 dark:bg-white/90 text-white dark:text-neutral-900 backdrop-blur-sm px-2 py-0.5 rounded">
            Save ${(product.compareAtPrice! - product.price).toFixed(0)}
          </div>
        ) : null}

        {/* Quick Add Overlay Button on Hover */}
        <div className="absolute inset-x-3 bottom-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <button
            onClick={handleQuickAdd}
            disabled={product.stock === 0}
            className="w-full py-2.5 px-3 bg-neutral-900/95 text-white dark:bg-white/95 dark:text-neutral-900 text-xs font-semibold rounded-xl backdrop-blur shadow-md hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            {product.stock === 0 ? 'Out of Stock' : 'Quick Add'}
          </button>
        </div>
      </div>

      {/* Card Content & Metadata */}
      <div className="p-4 flex flex-col flex-grow justify-between gap-2">
        <div>
          {/* Unboxed Brand / Category Metadata */}
          <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            <span>{product.brand?.name || 'MOO Essentials'}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{product.category?.name || 'Curated'}</span>
          </div>

          {/* Product Name */}
          <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mt-1 line-clamp-1 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
            {product.name}
          </h3>
        </div>

        {/* Rating and Price Baseline */}
        <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-neutral-700 dark:text-neutral-300">{product.rating.toFixed(1)}</span>
            <span className="text-[11px] text-neutral-400">({product.reviewCount})</span>
          </div>

          <div className="flex items-baseline gap-1.5">
            {hasDiscount && (
              <span className="text-xs line-through text-neutral-400 font-mono tabular-nums">
                ${product.compareAtPrice?.toFixed(2)}
              </span>
            )}
            <span className="text-sm font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
              ${product.price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
