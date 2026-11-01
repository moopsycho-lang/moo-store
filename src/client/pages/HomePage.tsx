// src/client/pages/HomePage.tsx
// Curated storefront landing page with bold hero campaign, category cards, and trending objects

import React, { useEffect, useState } from 'react';
import { ArrowRight, Sparkles, Clock } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.tsx';
import type { Product, Category } from '../../types/index.ts';

interface HomePageProps {
  onNavigate: (view: string, param?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [trending, setTrending] = useState<Product[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Flash sale countdown state
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 28, seconds: 45 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 24, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/products/trending').then(r => r.json()),
      fetch('/api/products/deals').then(r => r.json()),
      fetch('/api/products/meta/categories').then(r => r.json()),
    ])
      .then(([trendData, dealsData, catsData]) => {
        setTrending(trendData || []);
        setDeals(dealsData || []);
        setCategories(catsData || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. Storefront Hero: 1 bold campaign focal point */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6 sm:pt-8">
        <div className="relative rounded-3xl overflow-hidden aspect-[16/9] sm:aspect-[21/9] min-h-[420px] bg-neutral-900 flex items-center shadow-lg">
          <img
            src="/src/assets/images/moo_hero_lifestyle_1793502193397.jpg"
            alt="MOO Curated Living Space with electric kettle and brass orb lamp"
            referrerPolicy="no-referrer"
            className="absolute inset-0 w-full h-full object-cover object-center brightness-[0.75]"
          />
          {/* Subtle measured gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/85 via-neutral-950/40 to-transparent" />

          {/* Hero Content */}
          <div className="relative z-10 p-8 sm:p-14 md:p-16 max-w-2xl text-white space-y-4">
            <span className="text-xs uppercase tracking-widest font-semibold text-neutral-300">
              New Season 2026 Collection
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white" style={{ textWrap: 'balance' }}>
              Thoughtfully Curated Essentials For Modern Living
            </h1>
            <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-normal max-w-lg">
              Sculptural ceramics, precision desktop audio, architectural lighting, and substantial organic cotton staples designed to endure.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('catalog')}
                className="px-6 py-3.5 bg-white text-neutral-900 rounded-xl text-xs sm:text-sm font-bold hover:bg-neutral-100 transition-colors flex items-center gap-2 shadow-sm"
              >
                <span>Explore Full Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('category', 'home-living')}
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-semibold backdrop-blur-md transition-colors"
              >
                Home & Living
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Department Index</span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-1">
              Curated Categories
            </h2>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map(cat => (
            <div
              key={cat.id}
              onClick={() => onNavigate('category', cat.slug)}
              className="group cursor-pointer rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative">
                <img
                  src={cat.image || '/src/assets/images/moo_category_home_1793502193419.jpg'}
                  alt={cat.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                    {cat.name}
                  </h3>
                  <span className="text-xs font-mono text-neutral-400">{cat.productCount ?? 2} items</span>
                </div>
                <p className="text-xs text-neutral-500 mt-1 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Limited Runs & Deals Spotlight with Countdown */}
      {deals.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-neutral-900 text-white rounded-3xl p-6 sm:p-10 border border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Limited Run Deals & Seasonal Reductions</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Seasonal Archive & Flash Reductions
                </h2>
              </div>

              {/* Countdown Stepper */}
              <div className="flex items-center gap-2 bg-neutral-800/80 px-4 py-2 rounded-xl text-xs font-mono self-start sm:self-auto border border-neutral-700">
                <Clock className="w-4 h-4 text-neutral-400" />
                <span className="text-neutral-400">Ends in:</span>
                <span className="font-bold text-amber-300 tabular-nums">
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {deals.slice(0, 3).map(p => (
                <div key={p.id} className="text-neutral-900">
                  <ProductCard product={p} onSelect={slug => onNavigate('product', slug)} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Trending Objects Collection */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Customer Favorites</span>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white mt-1">
              Trending Objects
            </h2>
          </div>
          <button
            onClick={() => onNavigate('catalog')}
            className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
          >
            <span>Browse All {trending.length} Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trending.slice(0, 4).map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={slug => onNavigate('product', slug)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 5. Craftsmanship & Ethos Rest Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 p-8 sm:p-14 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <span className="font-mono text-xs text-neutral-400">01. Organic Integrity</span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-2">Zero Synthetic Additives</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
              Every textile is spun from GOTS-certified heavyweight organic cotton, free from artificial silicone coatings or microplastics.
            </p>
          </div>
          <div>
            <span className="font-mono text-xs text-neutral-400">02. Heirloom Craftsmanship</span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-2">Solid European Woods</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
              Our woodwork relies on FSC-certified white oak and traditional mortise joinery that gains character with generations of touch.
            </p>
          </div>
          <div>
            <span className="font-mono text-xs text-neutral-400">03. Honest Utility</span>
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mt-2">Frictionless Guarantee</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
              30-day no-questions return window, carbon-offset shipping, and prompt customer assistance directly from our studio team.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
