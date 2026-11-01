// src/client/components/Header.tsx
// Top Bar following the strict 3-Zone Top Bar Contract

import React, { useState, useEffect, useRef } from 'react';
import { ShoppingBag, Heart, Sun, Moon, User as UserIcon, Search, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCart } from '../context/CartContext.tsx';
import { useWishlist } from '../context/WishlistContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import type { Product } from '../../types/index.ts';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, param?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { user, logout, setIsAuthModalOpen, setAuthModalMode } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const { savedIds, setIsWishlistOpen } = useWishlist();
  const { theme, toggleTheme } = useTheme();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Search autocomplete debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.products || []);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectSearchResult = (product: Product) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    onNavigate('product', product.slug);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      onNavigate('catalog', searchQuery.trim());
      setSearchQuery('');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 dark:bg-neutral-950/90 dark:border-neutral-800 transition-colors">
        {/* Top announcement bar */}
        <div className="bg-neutral-900 text-neutral-100 dark:bg-neutral-900 dark:text-neutral-200 text-xs py-1.5 px-4 text-center font-medium tracking-wide">
          <span>Complimentary domestic express shipping on orders over $75 · Code: </span>
          <strong className="underline underline-offset-2">WELCOME10</strong>
          <span> for 10% off</span>
        </div>

        {/* Strict 3-zone Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark (Single text element in display style) */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-1.5 text-2xl font-black tracking-tighter text-neutral-900 dark:text-white hover:opacity-85 transition-opacity whitespace-nowrap shrink-0"
          >
            <span className="bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-2 py-0.5 rounded-lg text-lg tracking-normal font-bold">
              MOO
            </span>
          </button>

          {/* Zone 2: 4-5 single-line navigation links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            <button
              onClick={() => onNavigate('home')}
              className={`hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'home' ? 'text-neutral-950 dark:text-white font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate('catalog')}
              className={`hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'catalog' ? 'text-neutral-950 dark:text-white font-semibold' : ''
              }`}
            >
              Shop All
            </button>
            <button
              onClick={() => onNavigate('category', 'home-living')}
              className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Home & Living
            </button>
            <button
              onClick={() => onNavigate('category', 'tech-workspace')}
              className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Tech & Workspace
            </button>
            <button
              onClick={() => onNavigate('category', 'apparel-accessories')}
              className="hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
            >
              Apparel
            </button>
          </nav>

          {/* Zone 3: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Search Trigger */}
            <button
              onClick={() => {
                setIsSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Wishlist Trigger */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="relative p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="View wishlist"
            >
              <Heart className="w-5 h-5" />
              {savedIds.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                  {savedIds.length}
                </span>
              )}
            </button>

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="View shopping bag"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User Account / Menu */}
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <div>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-1.5 py-1.5 px-3 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <span>{user.name.split(' ')[0]}</span>
                    {user.role === 'ADMIN' && (
                      <span className="text-[10px] uppercase font-mono px-1 py-0.2 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 rounded">
                        Admin
                      </span>
                    )}
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="px-4 py-2 border-b border-neutral-100 dark:border-neutral-800">
                        <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                      </div>

                      {user.role === 'ADMIN' && (
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onNavigate('admin');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Admin Dashboard
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onNavigate('account');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2"
                      >
                        <UserIcon className="w-4 h-4 text-neutral-500" />
                        My Orders & Profile
                      </button>

                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 border-t border-neutral-100 dark:border-neutral-800 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAuthModalMode('signin');
                      setIsAuthModalOpen(true);
                    }}
                    className="text-xs font-medium px-3 py-2 text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white whitespace-nowrap"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setAuthModalMode('signup');
                      setIsAuthModalOpen(true);
                    }}
                    className="text-xs font-medium px-3.5 py-2 bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 rounded-lg whitespace-nowrap transition-colors"
                  >
                    Join
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Search Overlay Modal with Autocomplete */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-900/40 backdrop-blur-sm flex items-start justify-center pt-20 px-4">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <form onSubmit={handleSearchSubmit} className="relative p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-3">
              <Search className="w-5 h-5 text-neutral-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products by title, material, or SKU (e.g. ceramic, kettle, oak)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-sm focus:outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400"
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="text-xs font-mono px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 rounded"
              >
                ESC
              </button>
            </form>

            <div className="p-4 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="py-8 text-center text-xs text-neutral-400">Searching catalog...</div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-2">Suggestions</p>
                  {searchResults.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectSearchResult(p)}
                      className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]?.url || '/src/assets/images/moo_category_home_1793502193419.jpg'}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg bg-neutral-100 dark:bg-neutral-800"
                        />
                        <div>
                          <p className="text-xs font-semibold text-neutral-900 dark:text-white">{p.name}</p>
                          <p className="text-[11px] text-neutral-500">{p.category?.name || 'Curated Object'}</p>
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold tabular-nums text-neutral-900 dark:text-white">
                        ${p.price.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="py-8 text-center text-xs text-neutral-500">
                  No matching products found for "{searchQuery}".
                </div>
              ) : (
                <div className="py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-2 mb-2">Popular Searches</p>
                  <div className="flex flex-wrap gap-2 px-2">
                    {['Ceramic Kettle', 'Oak Stool', 'Wireless Headphones', 'Cotton Sweater', 'Face Oil'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSearchQuery(tag)}
                        className="text-xs px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
