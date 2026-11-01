// src/App.tsx
// Root application orchestrator with navigation router, contexts, drawers, and modal overlays

import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './client/context/ThemeContext.tsx';
import { ToastProvider } from './client/context/ToastContext.tsx';
import { AuthProvider } from './client/context/AuthContext.tsx';
import { CartProvider } from './client/context/CartContext.tsx';
import { WishlistProvider } from './client/context/WishlistContext.tsx';

import { Header } from './client/components/Header.tsx';
import { Footer } from './client/components/Footer.tsx';
import { CartDrawer } from './client/components/CartDrawer.tsx';
import { WishlistDrawer } from './client/components/WishlistDrawer.tsx';
import { AuthModal } from './client/components/AuthModal.tsx';

import { HomePage } from './client/pages/HomePage.tsx';
import { CatalogPage } from './client/pages/CatalogPage.tsx';
import { ProductDetailPage } from './client/pages/ProductDetailPage.tsx';
import { CheckoutPage } from './client/pages/CheckoutPage.tsx';
import { OrderConfirmationPage } from './client/pages/OrderConfirmationPage.tsx';
import { AccountPage } from './client/pages/AccountPage.tsx';
import { AdminDashboard } from './client/pages/AdminDashboard.tsx';

function MainApp() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);

  // Scroll to top on view transition
  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync hash/path for deep linking if present
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/admin')) {
        setCurrentView('admin');
      } else if (hash.startsWith('/product/')) {
        const slug = hash.replace('/product/', '');
        setCurrentView('product');
        setViewParam(slug);
      } else if (hash.startsWith('/category/')) {
        const slug = hash.replace('/category/', '');
        setCurrentView('category');
        setViewParam(slug);
      } else if (hash === '/catalog') {
        setCurrentView('catalog');
      } else if (hash === '/account') {
        setCurrentView('account');
      } else if (hash === '/checkout') {
        setCurrentView('checkout');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when navigating
  useEffect(() => {
    if (currentView === 'home') window.location.hash = '/';
    else if (currentView === 'admin') window.location.hash = '/admin';
    else if (currentView === 'catalog') window.location.hash = '/catalog';
    else if (currentView === 'account') window.location.hash = '/account';
    else if (currentView === 'checkout') window.location.hash = '/checkout';
    else if (currentView === 'product' && viewParam) window.location.hash = `/product/${viewParam}`;
    else if (currentView === 'category' && viewParam) window.location.hash = `/category/${viewParam}`;
  }, [currentView, viewParam]);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-50 transition-colors">
      {/* Header is shown on all views except full admin dashboard view */}
      {currentView !== 'admin' && (
        <Header currentView={currentView} onNavigate={handleNavigate} />
      )}

      {/* Primary Page Router */}
      <main className="flex-1">
        {currentView === 'home' && <HomePage onNavigate={handleNavigate} />}

        {currentView === 'catalog' && (
          <CatalogPage initialSearchQuery={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'category' && (
          <CatalogPage initialCategorySlug={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'product' && viewParam && (
          <ProductDetailPage slug={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'checkout' && <CheckoutPage onNavigate={handleNavigate} />}

        {currentView === 'order-confirmation' && viewParam && (
          <OrderConfirmationPage orderNumber={viewParam} onNavigate={handleNavigate} />
        )}

        {currentView === 'account' && <AccountPage onNavigate={handleNavigate} />}

        {currentView === 'admin' && <AdminDashboard onNavigate={handleNavigate} />}
      </main>

      {/* Footer is shown on all storefront views */}
      {currentView !== 'admin' && <Footer onNavigate={handleNavigate} />}

      {/* Global Slide-overs & Modals */}
      <CartDrawer
        onCheckout={() => handleNavigate('checkout')}
        onExplore={() => handleNavigate('catalog')}
      />

      <WishlistDrawer
        onSelectProduct={slug => handleNavigate('product', slug)}
      />

      <AuthModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <MainApp />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
