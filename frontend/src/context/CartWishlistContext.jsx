import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import cartService from '../services/cartService.js';
import wishlistService from '../services/wishlistService.js';

const CartWishlistContext = createContext(null);

export const CartWishlistProvider = ({ children }) => {
  const { isAuthenticated, promptLogin } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [wishlistItems, setWishlistItems] = useState([]); // Array of { id, productId }
  const [loading, setLoading] = useState(false);

  const refreshCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartCount(0);
      return;
    }
    try {
      const cart = await cartService.getCart();
      setCartCount(cart?.itemCount || 0);
    } catch {
      // Ignore background fetch error
    }
  }, [isAuthenticated]);

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlistItems([]);
      return;
    }
    try {
      const wishlist = await wishlistService.getWishlist();
      setWishlistItems(
        (wishlist?.items || []).map((item) => ({
          id: item.id,
          productId: item.productId
        }))
      );
    } catch {
      // Ignore background fetch error
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      refreshCart();
      refreshWishlist();
    } else {
      setCartCount(0);
      setWishlistItems([]);
    }
  }, [isAuthenticated, refreshCart, refreshWishlist]);

  const isProductWishlisted = useCallback(
    (productId) => {
      return wishlistItems.some((item) => item.productId === productId);
    },
    [wishlistItems]
  );

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      promptLogin('Sign in to save items to your wishlist');
      return { success: false, requiresAuth: true };
    }

    const existing = wishlistItems.find((item) => item.productId === productId);
    try {
      if (existing) {
        // Optimistic remove
        setWishlistItems((prev) => prev.filter((i) => i.productId !== productId));
        await wishlistService.removeWishlistItem(existing.id);
        return { success: true, wishlisted: false };
      } else {
        // Optimistic add
        const addedItem = await wishlistService.addToWishlist(productId);
        setWishlistItems((prev) => [
          ...prev,
          { id: addedItem?.id || productId, productId }
        ]);
        return { success: true, wishlisted: true };
      }
    } catch (err) {
      // Rollback
      refreshWishlist();
      throw err;
    }
  };

  const addItemToCart = async (productId, variantId = null, quantity = 1) => {
    if (!isAuthenticated) {
      promptLogin('Sign in to add items to your shopping cart');
      return { success: false, requiresAuth: true };
    }

    const cart = await cartService.addToCart(productId, variantId, quantity);
    if (cart?.itemCount != null) {
      setCartCount(cart.itemCount);
    } else {
      refreshCart();
    }
    return { success: true, cart };
  };

  return (
    <CartWishlistContext.Provider
      value={{
        cartCount,
        wishlistCount: wishlistItems.length,
        isProductWishlisted,
        toggleWishlist,
        addItemToCart,
        refreshCart,
        refreshWishlist
      }}
    >
      {children}
    </CartWishlistContext.Provider>
  );
};

export const useCartWishlist = () => {
  const context = useContext(CartWishlistContext);
  if (!context) {
    throw new Error('useCartWishlist must be used within a CartWishlistProvider');
  }
  return context;
};

export default CartWishlistContext;
