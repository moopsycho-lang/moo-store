// src/server/routes/admin.ts
// Comprehensive store management, analytics, inventory, order fulfillment, and promotions

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { requireAdmin, type AuthRequest } from '../auth.ts';
import type { OrderStatus } from '../../types/index.ts';

export const adminRouter = Router();

// Protect all admin routes with requireAdmin
adminRouter.use(requireAdmin);

// 1. Overview & Analytics
adminRouter.get('/overview', (req, res) => {
  const orders = db.getOrders();
  const products = db.getProducts({ limit: 1000, includeUnpublished: true }).products;
  const users = db.getUsers().filter(u => u.role === 'CUSTOMER');

  // Total Sales & Order count
  const validOrders = orders.filter(o => o.status !== 'CANCELLED' && o.status !== 'REFUNDED');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const totalCustomers = users.length;

  // Low stock products
  const lowStockProducts = products.filter(p => p.stock <= (p.lowStockAlert || 5));

  // Top selling products based on completed order items
  const productSalesMap = new Map<string, { id: string; name: string; units: number; revenue: number }>();
  for (const o of validOrders) {
    for (const item of o.items) {
      const curr = productSalesMap.get(item.productId) || {
        id: item.productId,
        name: item.name,
        units: 0,
        revenue: 0,
      };
      curr.units += item.quantity;
      curr.revenue += item.price * item.quantity;
      productSalesMap.set(item.productId, curr);
    }
  }
  const topProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  // Revenue chart: last 7 days daily breakdown
  const dailyRevenue: { date: string; revenue: number; orders: number }[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOrders = orders.filter(o => o.createdAt.startsWith(dateStr) && o.status !== 'CANCELLED');
    const dayRev = dayOrders.reduce((sum, o) => sum + o.total, 0);
    dailyRevenue.push({
      date: dateStr.slice(5), // MM-DD
      revenue: Number(dayRev.toFixed(2)),
      orders: dayOrders.length,
    });
  }

  // Recent 6 orders
  const recentOrders = orders.slice(0, 6);

  return res.json({
    metrics: {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      totalOrders,
      totalCustomers,
      lowStockCount: lowStockProducts.length,
      averageOrderValue: totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0,
    },
    dailyRevenue,
    topProducts,
    lowStockProducts: lowStockProducts.slice(0, 6),
    recentOrders,
  });
});

// 2. Product Management
adminRouter.get('/products', (req, res) => {
  const { page, limit, search, inStock, category } = req.query;
  const result = db.getProducts({
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 20,
    search: search ? String(search) : undefined,
    inStockOnly: inStock === 'true',
    categorySlug: category ? String(category) : undefined,
    includeUnpublished: true,
  });
  return res.json(result);
});

const productSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string(),
  price: z.number().positive(),
  compareAtPrice: z.number().optional(),
  costPrice: z.number().optional(),
  sku: z.string().min(2),
  stock: z.number().int().min(0),
  lowStockAlert: z.number().int().min(0).default(5),
  isPublished: z.boolean().default(true),
  categoryId: z.string(),
  brandId: z.string(),
  images: z.array(z.any()).default([]),
  variants: z.array(z.any()).default([]),
  tags: z.array(z.string()).default([]),
});

adminRouter.post('/products', (req: AuthRequest, res) => {
  const parse = productSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: parse.error.issues[0].message });
  }

  const newProduct = db.createProduct(parse.data as any);
  return res.status(201).json(newProduct);
});

adminRouter.put('/products/:id', (req: AuthRequest, res) => {
  const updated = db.updateProduct(req.params.id, req.body, req.user?.name || 'Admin');
  if (!updated) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  return res.json(updated);
});

adminRouter.delete('/products/:id', (req, res) => {
  const success = db.deleteProduct(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  return res.json({ message: 'Product deleted successfully.' });
});

// Bulk import products from JSON / CSV rows
adminRouter.post('/products/bulk-import', (req: AuthRequest, res) => {
  const { products } = req.body;
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'No products provided for import.' });
  }

  const created = [];
  const defaultCategory = db.getCategories()[0]?.id || 'cat-home';
  const defaultBrand = db.getBrands()[0]?.id || 'brand-moo';

  for (const item of products) {
    if (!item.name || !item.price) continue;
    const slug = (item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)/g, '');
    const product = db.createProduct({
      name: item.name,
      slug: `${slug}-${Math.floor(100 + Math.random() * 900)}`,
      description: item.description || 'Quality product from MOO catalogue.',
      price: Number(item.price),
      compareAtPrice: item.compareAtPrice ? Number(item.compareAtPrice) : undefined,
      costPrice: item.costPrice ? Number(item.costPrice) : undefined,
      sku: item.sku || `MOO-${Math.floor(10000 + Math.random() * 90000)}`,
      stock: Number(item.stock) || 10,
      lowStockAlert: Number(item.lowStockAlert) || 5,
      isPublished: true,
      categoryId: item.categoryId || defaultCategory,
      brandId: item.brandId || defaultBrand,
      images: item.image ? [{ id: `img-${Date.now()}`, productId: '', url: item.image, sortOrder: 0 }] : [],
      variants: [],
      tags: item.tags ? (Array.isArray(item.tags) ? item.tags : String(item.tags).split(',')) : [],
    });
    created.push(product);
  }

  return res.json({ message: `Successfully imported ${created.length} products.`, count: created.length });
});

// 3. Categories & Brands Management
adminRouter.get('/categories', (req, res) => res.json(db.getCategories()));
adminRouter.post('/categories', (req, res) => {
  const { name, slug, description, image } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required.' });
  const cat = db.createCategory({ name, slug, description, image });
  return res.status(201).json(cat);
});
adminRouter.put('/categories/:id', (req, res) => {
  const cat = db.updateCategory(req.params.id, req.body);
  if (!cat) return res.status(404).json({ error: 'Category not found.' });
  return res.json(cat);
});
adminRouter.delete('/categories/:id', (req, res) => {
  const ok = db.deleteCategory(req.params.id);
  return ok ? res.json({ message: 'Category deleted' }) : res.status(404).json({ error: 'Not found' });
});

adminRouter.get('/brands', (req, res) => res.json(db.getBrands()));
adminRouter.post('/brands', (req, res) => {
  const { name, slug, description, logo } = req.body;
  if (!name || !slug) return res.status(400).json({ error: 'Name and slug required.' });
  const brand = db.createBrand({ name, slug, description, logo });
  return res.status(201).json(brand);
});
adminRouter.put('/brands/:id', (req, res) => {
  const b = db.updateBrand(req.params.id, req.body);
  if (!b) return res.status(404).json({ error: 'Brand not found.' });
  return res.json(b);
});
adminRouter.delete('/brands/:id', (req, res) => {
  const ok = db.deleteBrand(req.params.id);
  return ok ? res.json({ message: 'Brand deleted' }) : res.status(404).json({ error: 'Not found' });
});

// 4. Orders Management
adminRouter.get('/orders', (req, res) => {
  const { status, search } = req.query;
  const orders = db.getOrders({
    status: status ? (String(status) as OrderStatus) : undefined,
    search: search ? String(search) : undefined,
  });
  return res.json(orders);
});

adminRouter.put('/orders/:id/status', (req, res) => {
  const { status, note, trackingNumber } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required.' });

  const updated = db.updateOrderStatus(req.params.id, status, note, trackingNumber);
  if (!updated) return res.status(404).json({ error: 'Order not found.' });
  return res.json(updated);
});

adminRouter.post('/orders/:id/refund', (req, res) => {
  const { reason, restock } = req.body;
  const updated = db.processOrderRefund(req.params.id, reason || 'Admin authorized refund', restock !== false);
  if (!updated) return res.status(404).json({ error: 'Order not found.' });
  return res.json(updated);
});

// 5. Customer Management
adminRouter.get('/customers', (req, res) => {
  const { search } = req.query;
  let customers = db.getUsers().filter(u => u.role === 'CUSTOMER');
  if (search) {
    const q = String(search).toLowerCase();
    customers = customers.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }

  // Hydrate with order stats
  const orders = db.getOrders();
  const list = customers.map(c => {
    const userOrders = orders.filter(o => o.userId === c.id);
    const totalSpent = userOrders
      .filter(o => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
      .reduce((sum, o) => sum + o.total, 0);

    return {
      id: c.id,
      name: c.name,
      email: c.email,
      role: c.role,
      isBlocked: c.isBlocked,
      createdAt: c.createdAt,
      orderCount: userOrders.length,
      totalSpent: Number(totalSpent.toFixed(2)),
      latestOrderDate: userOrders[0]?.createdAt || null,
    };
  });

  return res.json(list);
});

adminRouter.put('/customers/:id/toggle-block', (req, res) => {
  const user = db.findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  if (user.role === 'ADMIN') return res.status(400).json({ error: 'Cannot block administrator.' });

  const updated = db.updateUser(user.id, { isBlocked: !user.isBlocked });
  return res.json(updated);
});

// 6. Inventory Tracking & Adjustments
adminRouter.get('/inventory', (req, res) => {
  const products = db.getProducts({ limit: 1000, includeUnpublished: true }).products;
  const logs = db.getInventoryLogs();
  return res.json({ products, logs });
});

adminRouter.post('/inventory/adjust', (req: AuthRequest, res) => {
  const { productId, changeAmount, reason } = req.body;
  if (!productId || changeAmount === undefined) {
    return res.status(400).json({ error: 'Product ID and change amount required.' });
  }

  const updated = db.adjustProductStock(
    productId,
    Number(changeAmount),
    reason || 'Manual stock update',
    req.user?.name || 'Admin'
  );

  if (!updated) return res.status(404).json({ error: 'Product not found.' });
  return res.json(updated);
});

// 7. Promotions & Coupons
adminRouter.get('/coupons', (req, res) => res.json(db.getCoupons()));
adminRouter.post('/coupons', (req, res) => {
  const { code, type, value, minOrder, maxUses, expiresAt, isActive } = req.body;
  if (!code || value === undefined) return res.status(400).json({ error: 'Code and value required.' });

  const coupon = db.createCoupon({
    code,
    type: type || 'PERCENT',
    value: Number(value),
    minOrder: minOrder ? Number(minOrder) : undefined,
    maxUses: maxUses ? Number(maxUses) : undefined,
    expiresAt,
    isActive: isActive !== false,
  });
  return res.status(201).json(coupon);
});
adminRouter.put('/coupons/:id', (req, res) => {
  const updated = db.updateCoupon(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Coupon not found.' });
  return res.json(updated);
});
adminRouter.delete('/coupons/:id', (req, res) => {
  const ok = db.deleteCoupon(req.params.id);
  return ok ? res.json({ message: 'Coupon deleted.' }) : res.status(404).json({ error: 'Not found.' });
});

// Banners
adminRouter.get('/banners', (req, res) => res.json(db.getBanners(false)));
adminRouter.post('/banners', (req, res) => {
  const { title, subtitle, image, link, position, isActive } = req.body;
  if (!title || !image) return res.status(400).json({ error: 'Title and image are required.' });
  const banner = db.createBanner({
    title,
    subtitle,
    image,
    link: link || '/catalog',
    position: Number(position) || 0,
    isActive: isActive !== false,
  });
  return res.status(201).json(banner);
});
adminRouter.put('/banners/:id', (req, res) => {
  const updated = db.updateBanner(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Banner not found.' });
  return res.json(updated);
});
adminRouter.delete('/banners/:id', (req, res) => {
  const ok = db.deleteBanner(req.params.id);
  return ok ? res.json({ message: 'Banner deleted.' }) : res.status(404).json({ error: 'Not found.' });
});

// 8. Review Moderation
adminRouter.get('/reviews', (req, res) => {
  const reviews = db.getAllReviews();
  const hydrated = reviews.map(r => ({
    ...r,
    product: db.findProductById(r.productId),
  }));
  return res.json(hydrated);
});

adminRouter.put('/reviews/:id/status', (req, res) => {
  const { isApproved } = req.body;
  const updated = db.updateReviewStatus(req.params.id, Boolean(isApproved));
  if (!updated) return res.status(404).json({ error: 'Review not found.' });
  return res.json(updated);
});

adminRouter.delete('/reviews/:id', (req, res) => {
  const ok = db.deleteReview(req.params.id);
  return ok ? res.json({ message: 'Review deleted.' }) : res.status(404).json({ error: 'Not found.' });
});

// 9. Reports
adminRouter.get('/reports', (req, res) => {
  const orders = db.getOrders().filter(o => o.status !== 'CANCELLED');
  const products = db.getProducts({ limit: 1000, includeUnpublished: true }).products;

  // Revenue by Category
  const categoryRevenue = new Map<string, { categoryName: string; totalRevenue: number; unitsSold: number }>();
  for (const o of orders) {
    for (const item of o.items) {
      const p = products.find(prod => prod.id === item.productId);
      const catName = p?.category?.name || 'General';
      const curr = categoryRevenue.get(catName) || { categoryName: catName, totalRevenue: 0, unitsSold: 0 };
      curr.totalRevenue += item.price * item.quantity;
      curr.unitsSold += item.quantity;
      categoryRevenue.set(catName, curr);
    }
  }

  return res.json({
    categoryBreakdown: Array.from(categoryRevenue.values()),
    totalSalesCount: orders.length,
    grossVolume: orders.reduce((sum, o) => sum + o.total, 0),
  });
});

// 10. Store Settings & Shipping Zones
adminRouter.get('/settings', (req, res) => {
  const settings = db.getSettings();
  const shippingZones = db.getShippingZones();
  return res.json({ settings, shippingZones });
});

adminRouter.put('/settings', (req, res) => {
  const updated = db.updateSettings(req.body);
  return res.json(updated);
});

adminRouter.post('/shipping-zones', (req, res) => {
  const { name, countries, rate, freeThreshold } = req.body;
  if (!name || rate === undefined) return res.status(400).json({ error: 'Name and rate required.' });
  const zone = db.createShippingZone({
    name,
    countries: countries || ['United States'],
    rate: Number(rate),
    freeThreshold: freeThreshold ? Number(freeThreshold) : undefined,
  });
  return res.status(201).json(zone);
});

adminRouter.put('/shipping-zones/:id', (req, res) => {
  const updated = db.updateShippingZone(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Zone not found.' });
  return res.json(updated);
});

adminRouter.delete('/shipping-zones/:id', (req, res) => {
  const ok = db.deleteShippingZone(req.params.id);
  return ok ? res.json({ message: 'Zone deleted' }) : res.status(404).json({ error: 'Not found' });
});
