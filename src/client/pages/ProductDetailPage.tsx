// src/client/pages/ProductDetailPage.tsx
// High-fidelity PDP with sticky purchase module, variant selection, reviews, and related objects

import React, { useEffect, useState } from 'react';
import {
  Star,
  Heart,
  Plus,
  Minus,
  Truck,
  RotateCcw,
  ShieldCheck,
  Check,
  ShoppingBag,
  MessageSquarePlus,
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import type { Product, ProductVariant } from '../../types/index.ts';

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (view: string, param?: string) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ slug, onNavigate }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);

  // Review Form state
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const { addToCart } = useCart();
  const { toggleWishlist, isSaved } = useWishlist();
  const { user, setIsAuthModalOpen, setAuthModalMode, accessToken } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/slug/${slug}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data && data.product) {
          setProduct(data.product);
          setRelated(data.related || []);
          if (data.product.variants && data.product.variants.length > 0) {
            setSelectedVariant(data.product.variants[0]);
          } else {
            setSelectedVariant(null);
          }
          setSelectedImageIdx(0);
          setQuantity(1);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-800 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-6 w-32 bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="h-10 w-3/4 bg-neutral-200 dark:bg-neutral-800 rounded" />
            <div className="h-8 w-24 bg-neutral-200 dark:bg-neutral-800 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Product Not Found</h2>
        <p className="text-xs text-neutral-500">The requested item may have been relocated or archived.</p>
        <button
          onClick={() => onNavigate('catalog')}
          className="px-5 py-2.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
        >
          Return to Catalogue
        </button>
      </div>
    );
  }

  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;
  const isOutOfStock = currentStock <= 0;
  const saved = isSaved(product.id);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product.id, selectedVariant?.id, quantity);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthModalMode('signin');
      setIsAuthModalOpen(true);
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          rating: reviewRating,
          title: reviewTitle,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Review submitted successfully!', 'success');
        setIsReviewFormOpen(false);
        setReviewTitle('');
        setReviewComment('');
        // Refresh product data
        const prodRes = await fetch(`/api/products/slug/${slug}`);
        if (prodRes.ok) {
          const fresh = await prodRes.json();
          setProduct(fresh.product);
        }
      } else {
        showToast(data.error || 'Failed to submit review', 'error');
      }
    } catch {
      showToast('Network error submitting review', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-16">
      {/* Breadcrumb nav */}
      <nav className="flex items-center gap-2 text-xs text-neutral-500">
        <button onClick={() => onNavigate('home')} className="hover:text-neutral-900 dark:hover:text-white">
          Home
        </button>
        <span>/</span>
        <button
          onClick={() => onNavigate('category', product.category?.slug)}
          className="hover:text-neutral-900 dark:hover:text-white"
        >
          {product.category?.name || 'Catalogue'}
        </button>
        <span>/</span>
        <span className="text-neutral-900 dark:text-white font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Two-Column Purchase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-[4/3] w-full bg-neutral-100 dark:bg-neutral-800 rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800">
            <img
              src={product.images[selectedImageIdx]?.url || '/src/assets/images/moo_category_home_1793502193419.jpg'}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id || idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImageIdx === idx
                      ? 'border-neutral-900 dark:border-white shadow-sm'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              {product.brand?.name || 'MOO Essentials'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
              {product.name}
            </h1>

            {/* Ratings and SKU */}
            <div className="flex items-center gap-3 mt-2 text-xs text-neutral-500">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="font-bold text-neutral-800 dark:text-neutral-200">{product.rating.toFixed(1)}</span>
                <span className="text-neutral-400">({product.reviewCount} reviews)</span>
              </div>
              <span>·</span>
              <span className="font-mono text-neutral-400">SKU: {selectedVariant?.sku || product.sku}</span>
            </div>
          </div>

          {/* Price & Savings */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold font-mono tabular-nums text-neutral-900 dark:text-white">
                ${activePrice.toFixed(2)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > activePrice && (
                <span className="text-sm line-through text-neutral-400 font-mono tabular-nums">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
            {product.compareAtPrice && product.compareAtPrice > activePrice && (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-md">
                Save ${(product.compareAtPrice - activePrice).toFixed(0)}
              </span>
            )}
          </div>

          {/* Variants Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
                Options / Variants: <span className="font-normal text-neutral-500">{selectedVariant?.name}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selectedVariant?.id === variant.id
                        ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span>{variant.name}</span>
                    <span className="font-mono ml-2 opacity-80">${variant.price.toFixed(0)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Availability indicator */}
          <div className="text-xs">
            {isOutOfStock ? (
              <span className="font-semibold text-rose-600 dark:text-rose-400">Currently Sold Out</span>
            ) : currentStock <= 5 ? (
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Low Inventory — Only {currentStock} units available
              </span>
            ) : (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> In Stock — Ready to ship from New York hub
              </span>
            )}
          </div>

          {/* Quantity Stepper & Buy Actions */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-xl overflow-hidden bg-white dark:bg-neutral-900">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="p-3 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-xs font-mono font-bold tabular-nums">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(currentStock, q + 1))}
                disabled={quantity >= currentStock}
                className="p-3 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 py-3.5 px-6 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-40"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Bag'}</span>
            </button>

            <button
              onClick={() => toggleWishlist(product.id)}
              className="p-3.5 border border-neutral-300 dark:border-neutral-700 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
              aria-label="Wishlist toggle"
            >
              <Heart className={`w-5 h-5 ${saved ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          </div>

          {/* Service Promises */}
          <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 space-y-3 text-xs text-neutral-500">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <span>Complimentary shipping on orders over $75</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <span>30-day hassle-free returns & exchange policy</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <span>Stripe test-mode & Cash-on-Delivery payment options</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Specifications Tabs */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-12 max-w-3xl space-y-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Product Story & Utility</h2>
        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          {product.description}
        </p>

        {product.tags && product.tags.length > 0 && (
          <div className="pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Attributes</h4>
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Verified Reviews Section */}
      <div className="border-t border-neutral-200 dark:border-neutral-800 pt-12 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Customer Reviews</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Verified feedback from authenticated MOO patrons
            </p>
          </div>

          <button
            onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white rounded-xl text-xs font-semibold flex items-center gap-2 self-start"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Submit Review Box */}
        {isReviewFormOpen && (
          <form
            onSubmit={handleReviewSubmit}
            className="p-6 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 space-y-4 max-w-2xl"
          >
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Share Your Feedback</h4>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Star Rating
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 dark:text-neutral-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Headline
              </label>
              <input
                type="text"
                required
                value={reviewTitle}
                onChange={e => setReviewTitle(e.target.value)}
                placeholder="Ex: Exceptional build quality and feel"
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Review Details
              </label>
              <textarea
                required
                rows={3}
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder="Share your honest experience with durability, tactile feel, and performance..."
                className="w-full px-3.5 py-2 text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReviewFormOpen(false)}
                className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="px-5 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold rounded-xl"
              >
                Post Review
              </button>
            </div>
          </form>
        )}

        {/* Reviews List */}
        <div className="space-y-4 max-w-3xl">
          {!product.reviews || product.reviews.length === 0 ? (
            <div className="p-8 bg-neutral-50 dark:bg-neutral-900 rounded-2xl text-center text-xs text-neutral-500">
              No reviews yet. Be the first to review this object.
            </div>
          ) : (
            product.reviews.map(r => (
              <div
                key={r.id}
                className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">{r.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                  {r.comment}
                </p>

                <div className="text-[11px] text-neutral-400 flex items-center gap-2 pt-1">
                  <span>{r.userName}</span>
                  {r.isVerifiedPurchase && (
                    <>
                      <span>·</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Verified Purchaser</span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-16 space-y-8">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">Related Essentials</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map(p => (
              <ProductCard key={p.id} product={p} onSelect={s => onNavigate('product', s)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
