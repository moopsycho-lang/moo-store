// src/client/pages/CatalogPage.tsx
// Catalog browsing with category filters, price range, brand, rating, in-stock toggle, and pagination

import React, { useEffect, useState, useCallback } from 'react';
import { SlidersHorizontal, X, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../components/ProductCard.tsx';
import type { Product, Category, Brand } from '../../types/index.ts';

interface CatalogPageProps {
  initialCategorySlug?: string;
  initialSearchQuery?: string;
  onNavigate: (view: string, param?: string) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  initialCategorySlug,
  initialSearchQuery,
  onNavigate,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategorySlug || '');
  const [search, setSearch] = useState<string>(initialSearchQuery || '');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('newest');

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Mobile filters drawer
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Fetch metadata once
  useEffect(() => {
    Promise.all([
      fetch('/api/products/meta/categories').then(r => r.json()),
      fetch('/api/products/meta/brands').then(r => r.json()),
    ]).then(([cats, bnds]) => {
      setCategories(cats || []);
      setBrands(bnds || []);
    });
  }, []);

  // Sync props changes
  useEffect(() => {
    if (initialCategorySlug !== undefined) setSelectedCategory(initialCategorySlug);
  }, [initialCategorySlug]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) setSearch(initialSearchQuery);
  }, [initialSearchQuery]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedBrand) params.set('brand', selectedBrand);
      if (search.trim()) params.set('search', search.trim());
      if (minPrice) params.set('minPrice', minPrice);
      if (maxPrice) params.set('maxPrice', maxPrice);
      if (minRating > 0) params.set('minRating', String(minRating));
      if (inStockOnly) params.set('inStock', 'true');
      if (sortBy) params.set('sortBy', sortBy);
      params.set('page', String(page));
      params.set('limit', '12');

      const res = await fetch(`/api/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedBrand, search, minPrice, maxPrice, minRating, inStockOnly, sortBy, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSelectedBrand('');
    setSearch('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('newest');
    setPage(1);
  };

  const hasActiveFilters = Boolean(
    selectedCategory || selectedBrand || search || minPrice || maxPrice || minRating > 0 || inStockOnly
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Title & Search Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Catalogue Directory</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white mt-1">
            {selectedCategory
              ? categories.find(c => c.slug === selectedCategory)?.name || 'Curated Collection'
              : 'All Objects & Goods'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Showing {totalCount} {totalCount === 1 ? 'object' : 'objects'} crafted with integrity
          </p>
        </div>

        {/* Category Pills/Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <button
            onClick={() => {
              setSelectedCategory('');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              selectedCategory === ''
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
            }`}
          >
            All Items
          </button>
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCategory(c.slug);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === c.slug
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                  : 'bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Control bar: Filters toggle, active filter badges, sort dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterDrawerOpen(!isFilterDrawerOpen)}
            className="md:hidden px-3.5 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-semibold flex items-center gap-2 text-neutral-900 dark:text-white"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white" />}
          </button>

          {/* Active filter badges */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-neutral-400">Active:</span>
              {search && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200/80 dark:bg-neutral-800 rounded-md text-[11px] font-medium">
                  "{search}"
                  <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedBrand && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200/80 dark:bg-neutral-800 rounded-md text-[11px] font-medium">
                  {brands.find(b => b.id === selectedBrand)?.name}
                  <button onClick={() => setSelectedBrand('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {(minPrice || maxPrice) && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200/80 dark:bg-neutral-800 rounded-md text-[11px] font-medium font-mono">
                  ${minPrice || '0'} - ${maxPrice || '∞'}
                  <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              {inStockOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-200/80 dark:bg-neutral-800 rounded-md text-[11px] font-medium">
                  In Stock
                  <button onClick={() => setInStockOnly(false)}><X className="w-3 h-3" /></button>
                </span>
              )}
              <button
                onClick={handleResetFilters}
                className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline ml-1"
              >
                Reset All
              </button>
            </div>
          )}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-neutral-500 whitespace-nowrap">Sort by:</label>
          <select
            value={sortBy}
            onChange={e => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white text-neutral-900 dark:text-white"
          >
            <option value="newest">Newest Additions</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="name">Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Main Layout: Sidebar Filters + Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden md:block space-y-6">
          <div className="p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">Filter Catalog</h3>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-2">Price Range ($)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={e => { setMinPrice(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-lg bg-transparent text-neutral-900 dark:text-white"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={e => { setMaxPrice(e.target.value); setPage(1); }}
                  className="px-3 py-1.5 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded-lg bg-transparent text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            {/* Brand Filter */}
            <div>
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-2">Brand</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                  <input
                    type="radio"
                    name="brand"
                    checked={selectedBrand === ''}
                    onChange={() => { setSelectedBrand(''); setPage(1); }}
                    className="accent-neutral-900 dark:accent-white"
                  />
                  <span>All Brands</span>
                </label>
                {brands.map(b => (
                  <label key={b.id} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                    <input
                      type="radio"
                      name="brand"
                      checked={selectedBrand === b.id}
                      onChange={() => { setSelectedBrand(b.id); setPage(1); }}
                      className="accent-neutral-900 dark:accent-white"
                    />
                    <span>{b.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Minimum Rating */}
            <div>
              <label className="block text-xs font-semibold text-neutral-900 dark:text-white mb-2">Customer Rating</label>
              <div className="space-y-1.5">
                {[0, 4.5, 4.0].map(stars => (
                  <label key={stars} className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                    <input
                      type="radio"
                      name="rating"
                      checked={minRating === stars}
                      onChange={() => { setMinRating(stars); setPage(1); }}
                      className="accent-neutral-900 dark:accent-white"
                    />
                    <span>{stars === 0 ? 'Any Rating' : `${stars} Stars & Above`}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* In Stock Only */}
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <label className="flex items-center justify-between text-xs font-semibold text-neutral-900 dark:text-white cursor-pointer">
                <span>In Stock Only</span>
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={e => { setInStockOnly(e.target.checked); setPage(1); }}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-neutral-900"
                />
              </label>
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="md:col-span-3 space-y-8">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="aspect-[4/3] bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 p-8 space-y-4">
              <p className="text-base font-bold text-neutral-900 dark:text-white">No products found</p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                No items match your selected filters. Try broadening your criteria or reset the search filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={slug => onNavigate('product', slug)}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pNum = idx + 1;
                    return (
                      <button
                        key={pNum}
                        onClick={() => setPage(pNum)}
                        className={`w-9 h-9 rounded-xl text-xs font-mono font-medium transition-colors ${
                          page === pNum
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                            : 'border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
