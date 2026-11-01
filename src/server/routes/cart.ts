// src/server/routes/cart.ts
// Shopping cart with session persistence, coupon application, and tax/shipping recalculation

import { Router } from 'express';
import { z } from 'zod';
import { db, type StoredCart } from '../db.ts';
import { optionalAuth, type AuthRequest } from '../auth.ts';
import type { Cart, CartItem } from '../../types/index.ts';

export const cartRouter = Router();

// Helper to populate and calculate cart summary
function populateCart(stored: StoredCart): Cart {
  const settings = db.getSettings();
  const populatedItems: CartItem[] = [];
  let subtotal = 0;

  for (const item of stored.items) {
    const product = db.findProductById(item.productId);
    if (!product || !product.isPublished) continue;

    let variant = undefined;
    let itemPrice = product.price;

    if (item.variantId) {
      variant = product.variants.find(v => v.id === item.variantId);
      if (variant) {
        itemPrice = variant.price;
      }
    }

    populatedItems.push({
      id: item.id,
      productId: item.productId,
      product,
      variantId: item.variantId,
      variant,
      quantity: item.quantity,
      price: itemPrice,
    });

    subtotal += itemPrice * item.quantity;
  }

  // Calculate coupon discount
  let discount = 0;
  let coupon = null;
  if (stored.couponCode) {
    coupon = db.findCouponByCode(stored.couponCode) || null;
    if (coupon) {
      if (!coupon.minOrder || subtotal >= coupon.minOrder) {
        if (coupon.type === 'PERCENT') {
          discount = (subtotal * coupon.value) / 100;
        } else {
          discount = Math.min(coupon.value, subtotal);
        }
      }
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = Number((discountedSubtotal * settings.taxRate).toFixed(2));

  // Free shipping threshold
  const shipping = subtotal > 0 && subtotal >= settings.freeShippingThreshold ? 0 : (subtotal > 0 ? 8 : 0);
  const total = Number((discountedSubtotal + tax + shipping).toFixed(2));

  return {
    id: stored.id,
    items: populatedItems,
    coupon,
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    tax,
    shipping,
    total,
  };
}

// Get current cart
cartRouter.get('/', optionalAuth, (req: AuthRequest, res) => {
  const token = req.headers['x-cart-token'] as string | undefined;
  const stored = db.getCart(token, req.user?.id);
  const cart = populateCart(stored);
  return res.json({ cart, token: stored.token });
});

const addItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
});

// Add item to cart
cartRouter.post('/items', optionalAuth, (req: AuthRequest, res) => {
  try {
    const parse = addItemSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const { productId, variantId, quantity } = parse.data;
    const product = db.findProductById(productId);
    if (!product || !product.isPublished) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    const availableStock = variantId
      ? (product.variants.find(v => v.id === variantId)?.stock ?? product.stock)
      : product.stock;

    if (availableStock <= 0) {
      return res.status(400).json({ error: 'This item is currently out of stock.' });
    }

    const token = req.headers['x-cart-token'] as string | undefined;
    const stored = db.getCart(token, req.user?.id);

    // Check if item already in cart
    const existingIndex = stored.items.findIndex(
      i => i.productId === productId && (i.variantId || '') === (variantId || '')
    );

    if (existingIndex >= 0) {
      const newQty = stored.items[existingIndex].quantity + quantity;
      stored.items[existingIndex].quantity = Math.min(newQty, availableStock);
    } else {
      stored.items.push({
        id: `citem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId,
        variantId,
        quantity: Math.min(quantity, availableStock),
      });
    }

    db.updateCart(stored);
    const cart = populateCart(stored);
    return res.json({ cart, token: stored.token });
  } catch (error) {
    console.error('Add cart item error:', error);
    return res.status(500).json({ error: 'Failed to update cart.' });
  }
});

// Update item quantity
cartRouter.put('/items/:itemId', optionalAuth, (req: AuthRequest, res) => {
  const { quantity } = req.body;
  const { itemId } = req.params;

  const token = req.headers['x-cart-token'] as string | undefined;
  const stored = db.getCart(token, req.user?.id);

  const itemIndex = stored.items.findIndex(i => i.id === itemId);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not in cart.' });
  }

  if (quantity <= 0) {
    stored.items.splice(itemIndex, 1);
  } else {
    // Check product stock limit
    const item = stored.items[itemIndex];
    const product = db.findProductById(item.productId);
    const maxStock = product?.stock || 99;
    stored.items[itemIndex].quantity = Math.min(quantity, maxStock);
  }

  db.updateCart(stored);
  const cart = populateCart(stored);
  return res.json({ cart, token: stored.token });
});

// Remove item
cartRouter.delete('/items/:itemId', optionalAuth, (req: AuthRequest, res) => {
  const { itemId } = req.params;
  const token = req.headers['x-cart-token'] as string | undefined;
  const stored = db.getCart(token, req.user?.id);

  stored.items = stored.items.filter(i => i.id !== itemId);
  db.updateCart(stored);

  const cart = populateCart(stored);
  return res.json({ cart, token: stored.token });
});

// Apply coupon
cartRouter.post('/coupon', optionalAuth, (req: AuthRequest, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code required.' });

  const coupon = db.findCouponByCode(code);
  if (!coupon) {
    return res.status(404).json({ error: 'Invalid or expired coupon code.' });
  }

  const token = req.headers['x-cart-token'] as string | undefined;
  const stored = db.getCart(token, req.user?.id);

  // Validate min order if any
  const tempCart = populateCart(stored);
  if (coupon.minOrder && tempCart.subtotal < coupon.minOrder) {
    return res.status(400).json({
      error: `Coupon requires a minimum order of $${coupon.minOrder.toFixed(2)}.`,
    });
  }

  stored.couponCode = coupon.code;
  db.updateCart(stored);

  const cart = populateCart(stored);
  return res.json({ cart, message: `Coupon ${coupon.code} applied successfully!` });
});

// Remove coupon
cartRouter.delete('/coupon', optionalAuth, (req: AuthRequest, res) => {
  const token = req.headers['x-cart-token'] as string | undefined;
  const stored = db.getCart(token, req.user?.id);

  stored.couponCode = null;
  db.updateCart(stored);

  const cart = populateCart(stored);
  return res.json({ cart, message: 'Coupon removed.' });
});

// Clear cart
cartRouter.delete('/', optionalAuth, (req: AuthRequest, res) => {
  const token = req.headers['x-cart-token'] as string | undefined;
  const stored = db.getCart(token, req.user?.id);
  db.clearCart(stored.id);
  return res.json({ message: 'Cart cleared.' });
});
