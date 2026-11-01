// src/server/routes/products.ts
// Product catalog, categories, brands, banners, and customer reviews

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db.ts';
import { requireAuth, type AuthRequest } from '../auth.ts';

export const productsRouter = Router();

// Catalog query with filters, sorting, search, and pagination
productsRouter.get('/', (req, res) => {
  try {
    const {
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      sortBy,
      page,
      limit,
    } = req.query;

    const result = db.getProducts({
      categorySlug: category ? String(category) : undefined,
      brandId: brand ? String(brand) : undefined,
      search: search ? String(search) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minRating: minRating ? Number(minRating) : undefined,
      inStockOnly: inStock === 'true',
      sortBy: sortBy as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    });

    return res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to retrieve products.' });
  }
});

// Trending products
productsRouter.get('/trending', (req, res) => {
  const all = db.getProducts({ limit: 8, sortBy: 'rating' });
  return res.json(all.products);
});

// Deals / Flash sales (items with compareAtPrice > price)
productsRouter.get('/deals', (req, res) => {
  const all = db.getProducts({ limit: 100 }).products;
  const deals = all.filter(p => p.compareAtPrice && p.compareAtPrice > p.price).slice(0, 8);
  return res.json(deals);
});

// New arrivals
productsRouter.get('/new-arrivals', (req, res) => {
  const all = db.getProducts({ limit: 8, sortBy: 'newest' });
  return res.json(all.products);
});

// Single product by slug with related products
productsRouter.get('/slug/:slug', (req, res) => {
  const { slug } = req.params;
  const product = db.findProductBySlug(slug);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  // Related products from same category or brand
  const related = db.getProducts({ categorySlug: product.category?.slug, limit: 5 }).products
    .filter(p => p.id !== product.id)
    .slice(0, 4);

  return res.json({ product, related });
});

// Single product by ID
productsRouter.get('/:id', (req, res) => {
  const product = db.findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  return res.json(product);
});

// Categories
productsRouter.get('/meta/categories', (req, res) => {
  const categories = db.getCategories();
  return res.json(categories);
});

// Brands
productsRouter.get('/meta/brands', (req, res) => {
  const brands = db.getBrands();
  return res.json(brands);
});

// Banners
productsRouter.get('/meta/banners', (req, res) => {
  const banners = db.getBanners(true);
  return res.json(banners);
});

// Reviews for a product
productsRouter.get('/:id/reviews', (req, res) => {
  const reviews = db.getReviewsByProductId(req.params.id);
  return res.json(reviews);
});

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().min(2, 'Title is required'),
  comment: z.string().min(10, 'Review comment must be at least 10 characters'),
});

// Submit a review (customer only)
productsRouter.post('/:id/reviews', requireAuth, (req: AuthRequest, res) => {
  try {
    const parse = reviewSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ error: parse.error.issues[0].message });
    }

    const productId = req.params.id;
    const product = db.findProductById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Check if user is a verified purchaser
    const userOrders = db.getOrders({ userId: req.user!.id });
    const isVerifiedPurchase = userOrders.some(order =>
      order.status !== 'CANCELLED' &&
      order.items.some(item => item.productId === productId)
    );

    const review = db.createReview({
      productId,
      userId: req.user!.id,
      userName: req.user!.name,
      rating: parse.data.rating,
      title: parse.data.title,
      comment: parse.data.comment,
      isVerifiedPurchase,
      isApproved: true, // auto-approve with moderation queue available in admin
    });

    return res.status(201).json(review);
  } catch (error) {
    console.error('Submit review error:', error);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
});
