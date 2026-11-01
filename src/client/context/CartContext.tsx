// src/client/context/CartContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Cart } from '../../types/index.ts';
import { useAuth } from './AuthContext.tsx';
import { useToast } from './ToastContext.tsx';

interface CartContextType {
  cart: Cart | null;
  itemCount: number;
  isLoading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType>({
  cart: null,
  itemCount: 0,
  isLoading: true,
  isCartOpen: false,
  setIsCartOpen: () => {},
  addToCart: async () => false,
  updateQuantity: async () => {},
  removeFromCart: async () => {},
  applyCoupon: async () => false,
  removeCoupon: async () => {},
  clearCart: async () => {},
  refreshCart: async () => {},
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { accessToken } = useAuth();
  const { showToast } = useToast();

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('moo_cart_token');
    if (token) headers['x-cart-token'] = token;
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    return headers;
  }, [accessToken]);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
        if (data.token) {
          localStorage.setItem('moo_cart_token', data.token);
        }
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = async (productId: string, variantId?: string, quantity: number = 1): Promise<boolean> => {
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ productId, variantId, quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Failed to add item to bag', 'error');
        return false;
      }
      setCart(data.cart);
      if (data.token) localStorage.setItem('moo_cart_token', data.token);
      showToast('Item added to your bag', 'success');
      setIsCartOpen(true);
      return true;
    } catch {
      showToast('Error updating bag', 'error');
      return false;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const res = await fetch(`/api/cart/items/${itemId}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
        showToast('Item removed from bag', 'info');
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/cart/coupon', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || 'Invalid coupon code', 'error');
        return false;
      }
      setCart(data.cart);
      showToast(data.message || 'Coupon code applied!', 'success');
      return true;
    } catch {
      showToast('Error applying coupon', 'error');
      return false;
    }
  };

  const removeCoupon = async () => {
    try {
      const res = await fetch('/api/cart/coupon', {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data.cart);
        showToast('Coupon removed', 'info');
      }
    } catch (err) {
      console.error('Failed to remove coupon:', err);
    }
  };

  const clearCart = async () => {
    try {
      await fetch('/api/cart', {
        method: 'DELETE',
        headers: getHeaders(),
      });
      await fetchCart();
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        itemCount,
        isLoading,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        applyCoupon,
        removeCoupon,
        clearCart,
        refreshCart: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
