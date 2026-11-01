// src/server/routes/user.ts
// Customer profile, address book, and wishlist management

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { requireAuth, type AuthRequest } from '../auth.ts';

export const userRouter = Router();

// Get addresses
userRouter.get('/addresses', requireAuth, (req: AuthRequest, res) => {
  const addresses = db.getAddresses(req.user!.id);
  return res.json(addresses);
});

const addressSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  phone: z.string().optional(),
  line1: z.string().min(3, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().default('United States'),
  isDefault: z.boolean().default(false),
});

// Add address
userRouter.post('/addresses', requireAuth, (req: AuthRequest, res) => {
  const parse = addressSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.issues[0].message });
  }

  const newAddress = db.createAddress({
    userId: req.user!.id,
    ...parse.data,
  });

  return res.status(201).json(newAddress);
});

// Update address
userRouter.put('/addresses/:id', requireAuth, (req: AuthRequest, res) => {
  const parse = addressSchema.partial().safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.issues[0].message });
  }

  const updated = db.updateAddress(req.params.id, req.user!.id, parse.data);
  if (!updated) {
    return res.status(404).json({ error: 'Address not found.' });
  }

  return res.json(updated);
});

// Delete address
userRouter.delete('/addresses/:id', requireAuth, (req: AuthRequest, res) => {
  const success = db.deleteAddress(req.params.id, req.user!.id);
  if (!success) {
    return res.status(404).json({ error: 'Address not found.' });
  }
  return res.json({ message: 'Address removed.' });
});

// Get wishlist items (hydrated products)
userRouter.get('/wishlist', requireAuth, (req: AuthRequest, res) => {
  const productIds = db.getWishlist(req.user!.id);
  const products = productIds
    .map(id => db.findProductById(id))
    .filter(Boolean);
  return res.json({ productIds, products });
});

// Toggle wishlist item
userRouter.post('/wishlist/toggle', requireAuth, (req: AuthRequest, res) => {
  const { productId } = req.body;
  if (!productId) return res.status(400).json({ error: 'Product ID required.' });

  const productIds = db.toggleWishlist(req.user!.id, productId);
  return res.json({ productIds, saved: productIds.includes(productId) });
});

// Update profile
userRouter.put('/profile', requireAuth, (req: AuthRequest, res) => {
  const { name } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'Valid name is required.' });
  }

  const updated = db.updateUser(req.user!.id, { name: name.trim() });
  return res.json({ user: updated });
});
