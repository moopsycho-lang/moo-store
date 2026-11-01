// src/client/context/WishlistContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useToast } from './ToastContext.tsx';

interface WishlistContextType {
  savedIds: string[];
  isWishlistOpen: boolean;
  setIsWishlistOpen: (open: boolean) => void;
  toggleWishlist: (productId: string) => Promise<void>;
  isSaved: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType>({
  savedIds: [],
  isWishlistOpen: false,
  setIsWishlistOpen: () => {},
  toggleWishlist: async () => {},
  isSaved: () => false,
});

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const { user, accessToken, setIsAuthModalOpen } = useAuth();
  const { showToast } = useToast();

  const fetchWishlist = useCallback(async () => {
    if (!accessToken) {
      // Local fallback for guest
      const local = localStorage.getItem('moo_guest_wishlist');
      if (local) {
        try {
          setSavedIds(JSON.parse(local));
        } catch {}
      }
      return;
    }
    try {
      const res = await fetch('/api/user/wishlist', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedIds(data.productIds || []);
      }
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist, user]);

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      // In guest mode, save to local storage
      const exists = savedIds.includes(productId);
      const next = exists ? savedIds.filter(id => id !== productId) : [...savedIds, productId];
      setSavedIds(next);
      localStorage.setItem('moo_guest_wishlist', JSON.stringify(next));
      showToast(exists ? 'Item removed from wishlist' : 'Item saved to wishlist', 'info');
      return;
    }

    try {
      const res = await fetch('/api/user/wishlist/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedIds(data.productIds);
        showToast(data.saved ? 'Item saved to your wishlist' : 'Item removed from wishlist', 'info');
      }
    } catch {
      showToast('Could not update wishlist', 'error');
    }
  };

  const isSaved = (productId: string) => savedIds.includes(productId);

  return (
    <WishlistContext.Provider
      value={{
        savedIds,
        isWishlistOpen,
        setIsWishlistOpen,
        toggleWishlist,
        isSaved,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
