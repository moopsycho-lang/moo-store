// src/server/routes/orders.ts
// Order placement, Stripe test payments, COD, tracking timeline, and reorders

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { optionalAuth, requireAuth, type AuthRequest } from '../auth.ts';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '../../types/index.ts';

export const ordersRouter = Router();

// Calculate checkout preview
ordersRouter.post('/calculate', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { items, shippingZoneId, couponCode } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in order.' });
    }

    const settings = db.getSettings();
    let subtotal = 0;

    for (const item of items) {
      const product = db.findProductById(item.productId);
      if (!product) continue;
      const price = item.price || product.price;
      subtotal += price * (item.quantity || 1);
    }

    let discount = 0;
    if (couponCode) {
      const coupon = db.findCouponByCode(couponCode);
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

    // Shipping zone calculation
    let shippingCost = 8;
    if (shippingZoneId) {
      const zone = db.findShippingZoneById(shippingZoneId);
      if (zone) {
        shippingCost = (zone.freeThreshold && discountedSubtotal >= zone.freeThreshold) ? 0 : zone.rate;
      }
    } else if (discountedSubtotal >= settings.freeShippingThreshold) {
      shippingCost = 0;
    }

    const total = Number((discountedSubtotal + tax + shippingCost).toFixed(2));

    return res.json({
      subtotal: Number(subtotal.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      tax,
      shippingCost,
      total,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Calculation failed.' });
  }
});

const createOrderSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    phone: z.string().optional(),
    line1: z.string().min(3),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().default('United States'),
  }),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string().optional(),
      name: z.string(),
      price: z.number().positive(),
      quantity: z.number().int().min(1),
      image: z.string().optional(),
    })
  ).min(1, 'Order must contain at least one item'),
  shippingZoneId: z.string().optional(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['STRIPE', 'CASH_ON_DELIVERY']),
  paymentDetails: z.object({
    cardNumber: z.string().optional(),
    expDate: z.string().optional(),
    cvv: z.string().optional(),
  }).optional(),
});

// Create Order (Guest or Logged in user)
ordersRouter.post('/', optionalAuth, (req: AuthRequest, res) => {
  try {
    const parse = createOrderSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const {
      customerName,
      customerEmail,
      shippingAddress,
      items,
      shippingZoneId,
      couponCode,
      paymentMethod,
    } = parse.data;

    // Check stock for all items
    for (const item of items) {
      const product = db.findProductById(item.productId);
      if (!product) {
        return res.status(404).json({ error: `Product "${item.name}" is no longer available.` });
      }
      const availableStock = item.variantId
        ? (product.variants.find(v => v.id === item.variantId)?.stock ?? product.stock)
        : product.stock;

      if (availableStock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${item.name}". Only ${availableStock} remaining.`,
        });
      }
    }

    const settings = db.getSettings();
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }

    let discount = 0;
    if (couponCode) {
      const coupon = db.findCouponByCode(couponCode);
      if (coupon) {
        if (!coupon.minOrder || subtotal >= coupon.minOrder) {
          if (coupon.type === 'PERCENT') {
            discount = (subtotal * coupon.value) / 100;
          } else {
            discount = Math.min(coupon.value, subtotal);
          }
          db.incrementCouponUse(coupon.code);
        }
      }
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const tax = Number((discountedSubtotal * settings.taxRate).toFixed(2));

    let shippingCost = 8;
    if (shippingZoneId) {
      const zone = db.findShippingZoneById(shippingZoneId);
      if (zone) {
        shippingCost = (zone.freeThreshold && discountedSubtotal >= zone.freeThreshold) ? 0 : zone.rate;
      }
    } else if (discountedSubtotal >= settings.freeShippingThreshold) {
      shippingCost = 0;
    }

    const total = Number((discountedSubtotal + tax + shippingCost).toFixed(2));

    const status: OrderStatus = paymentMethod === 'STRIPE' ? 'PAID' : 'PENDING';
    const paymentStatus: PaymentStatus = paymentMethod === 'STRIPE' ? 'PAID' : 'PENDING';
    const timelineNote = paymentMethod === 'STRIPE'
      ? 'Payment authorized & verified via Stripe (Test Mode)'
      : 'Order received with Cash on Delivery (payment due upon arrival)';

    const order = db.createOrder({
      userId: req.user?.id || null,
      customerEmail: customerEmail.toLowerCase(),
      customerName,
      shippingAddress: {
        id: `addr-ord-${Date.now()}`,
        userId: req.user?.id || 'guest',
        isDefault: false,
        ...shippingAddress,
      },
      items: items.map(item => ({
        id: `oi-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        ...item,
      })),
      subtotal: Number(subtotal.toFixed(2)),
      tax,
      shippingCost,
      discount: Number(discount.toFixed(2)),
      total,
      status,
      paymentMethod,
      paymentStatus,
      trackingNumber: `MOO-TRK-${Math.floor(10000000 + Math.random() * 90000000)}`,
      timelineNote,
    });

    // Clear cart if user provided cart token or authenticated
    const token = req.headers['x-cart-token'] as string | undefined;
    const cart = db.getCart(token, req.user?.id);
    if (cart) {
      db.clearCart(cart.id);
    }

    return res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Failed to place order.' });
  }
});

// Get customer orders
ordersRouter.get('/', requireAuth, (req: AuthRequest, res) => {
  const orders = db.getOrders({ userId: req.user!.id });
  return res.json(orders);
});

// Get order by Order Number or ID
ordersRouter.get('/:identifier', (req, res) => {
  const { identifier } = req.params;
  const order = db.findOrderByOrderNumber(identifier) || db.findOrderById(identifier);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  return res.json(order);
});

// Reorder: load order items back into user's cart
ordersRouter.post('/:id/reorder', optionalAuth, (req: AuthRequest, res) => {
  const order = db.findOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  const token = req.headers['x-cart-token'] as string | undefined;
  const cart = db.getCart(token, req.user?.id);

  for (const item of order.items) {
    const existing = cart.items.find(i => i.productId === item.productId && i.variantId === item.variantId);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      cart.items.push({
        id: `citem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      });
    }
  }

  db.updateCart(cart);
  return res.json({ message: 'Items added back to your cart!', count: cart.items.length });
});

// Customer return / refund request
ordersRouter.post('/:id/return-request', requireAuth, (req: AuthRequest, res) => {
  const { reason } = req.body;
  const order = db.findOrderById(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  if (order.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Unauthorized.' });
  }

  order.timeline.push({
    status: order.status,
    timestamp: new Date().toISOString(),
    note: `Customer requested return/refund: ${reason || 'Item not needed/defective'}`,
  });

  return res.json({ message: 'Return request submitted. Our team will review within 24 hours.', order });
});
