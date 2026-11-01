// src/server/db.ts
// Robust file-persisted relational database engine for MOO e-commerce

import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import type {
  User,
  Address,
  Category,
  Brand,
  Product,
  ProductVariant,
  ProductImage,
  Review,
  Order,
  Coupon,
  InventoryLog,
  ShippingZone,
  Banner,
  StoreSettings,
  OrderStatus,
  PaymentStatus,
  PaymentMethod
} from '../types/index.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'moo_db.json');

export interface StoredCartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface StoredCart {
  id: string;
  token?: string;
  userId?: string | null;
  items: StoredCartItem[];
  couponCode?: string | null;
  updatedAt: string;
}

export interface StoredWishlist {
  userId: string;
  productIds: string[];
}

export interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  addresses: Address[];
  categories: Category[];
  brands: Brand[];
  products: Product[];
  reviews: Review[];
  orders: Order[];
  coupons: Coupon[];
  inventoryLogs: InventoryLog[];
  shippingZones: ShippingZone[];
  banners: Banner[];
  settings: StoreSettings;
  carts: StoredCart[];
  wishlists: StoredWishlist[];
}

// Initial seed data generator
function createInitialDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const adminPasswordHash = bcrypt.hashSync('admin123', salt);
  const customerPasswordHash = bcrypt.hashSync('password123', salt);

  const categories: Category[] = [
    {
      id: 'cat-home',
      name: 'Home & Living',
      slug: 'home-living',
      description: 'Sculptural furniture, artisanal ceramics, and architectural lighting for refined spaces.',
      image: '/src/assets/images/moo_category_home_1793502193419.jpg',
      productCount: 3,
    },
    {
      id: 'cat-tech',
      name: 'Tech & Workspace',
      slug: 'tech-workspace',
      description: 'Precision audio equipment, desk accessories, and minimalist tools for focused work.',
      image: '/src/assets/images/moo_category_tech_1793502193542.jpg',
      productCount: 2,
    },
    {
      id: 'cat-apparel',
      name: 'Apparel & Accessories',
      slug: 'apparel-accessories',
      description: 'Substantial organic cotton staples and handcrafted leather accessories made to last.',
      image: '/src/assets/images/moo_category_apparel_1793502194110.jpg',
      productCount: 2,
    },
    {
      id: 'cat-wellness',
      name: 'Wellness & Care',
      slug: 'wellness-care',
      description: 'Pure botanical formulations and minimalist grooming rituals crafted with plant extracts.',
      image: '/src/assets/images/moo_category_wellness_1793502193873.jpg',
      productCount: 1,
    },
  ];

  const brands: Brand[] = [
    { id: 'brand-moo', name: 'Moo Essentials', slug: 'moo-essentials', description: 'Our signature line of timeless functional objects.' },
    { id: 'brand-kanso', name: 'Kanso Studio', slug: 'kanso-studio', description: 'Japanese-inspired minimalist aesthetic tools.' },
    { id: 'brand-nordic', name: 'Nordic Form', slug: 'nordic-form', description: 'Sustainable Scandinavian woodwork and lighting.' },
    { id: 'brand-botanica', name: 'Botanica Botanicals', slug: 'botanica', description: 'Small-batch organic apothecary and body care.' },
  ];

  const products: Product[] = [
    {
      id: 'prod-kettle',
      name: 'Moo Arc Matte Ceramic Electric Kettle',
      slug: 'moo-arc-matte-ceramic-kettle',
      description: 'A sculptural countertop centerpiece featuring precise variable temperature control, precision pour gooseneck spout, and whisper-quiet heating element.',
      price: 78,
      compareAtPrice: 95,
      costPrice: 42,
      sku: 'MOO-KIT-001',
      stock: 34,
      lowStockAlert: 8,
      isPublished: true,
      rating: 4.9,
      reviewCount: 42,
      categoryId: 'cat-home',
      brandId: 'brand-moo',
      images: [
        { id: 'img-1', productId: 'prod-kettle', url: '/src/assets/images/moo_hero_lifestyle_1793502193397.jpg', sortOrder: 0, alt: 'Matte ceramic electric kettle on oak sideboard' }
      ],
      variants: [
        { id: 'var-kettle-bone', productId: 'prod-kettle', name: 'Bone White', sku: 'MOO-KIT-001-WHT', price: 78, stock: 22, options: { color: 'Bone White' } },
        { id: 'var-kettle-charcoal', productId: 'prod-kettle', name: 'Charcoal Black', sku: 'MOO-KIT-001-BLK', price: 78, stock: 12, options: { color: 'Charcoal' } }
      ],
      tags: ['Bestseller', 'Kitchen', 'Ceramic', 'Temperature Control'],
      createdAt: '2026-09-15T10:00:00Z',
    },
    {
      id: 'prod-stool',
      name: 'Nordic Solid Oak Stool & Display Stand',
      slug: 'nordic-solid-oak-stool',
      description: 'Hand-carved from sustainable European white oak with angled tripod legs and soft radiused edges. Functions effortlessly as a versatile stool, side perch, or plant pedestal.',
      price: 145,
      compareAtPrice: 180,
      costPrice: 80,
      sku: 'NOR-FRN-002',
      stock: 14,
      lowStockAlert: 5,
      isPublished: true,
      rating: 4.8,
      reviewCount: 29,
      categoryId: 'cat-home',
      brandId: 'brand-nordic',
      images: [
        { id: 'img-2', productId: 'prod-stool', url: '/src/assets/images/moo_category_home_1793502193419.jpg', sortOrder: 0, alt: 'Solid oak stool with sculpted vase' }
      ],
      variants: [
        { id: 'var-stool-natural', productId: 'prod-stool', name: 'Natural Oak', sku: 'NOR-FRN-002-NAT', price: 145, stock: 10, options: { color: 'Natural Oak' } },
        { id: 'var-stool-smoked', productId: 'prod-stool', name: 'Smoked Oak', sku: 'NOR-FRN-002-SMK', price: 155, stock: 4, options: { color: 'Smoked Oak' } }
      ],
      tags: ['Solid Wood', 'Handcrafted', 'Minimalist'],
      createdAt: '2026-09-18T11:30:00Z',
    },
    {
      id: 'prod-lamp',
      name: 'Architectural Brass & Glass Orb Lamp',
      slug: 'architectural-brass-orb-lamp',
      description: 'An ethereal illuminated sphere embraced by a brushed brass arched silhouette. Emits warm diffused ambient glow with touch-dimming base.',
      price: 120,
      compareAtPrice: 150,
      costPrice: 65,
      sku: 'MOO-LGT-003',
      stock: 4, // Intentionally low stock to showcase admin low-stock alert!
      lowStockAlert: 6,
      isPublished: true,
      rating: 5.0,
      reviewCount: 18,
      categoryId: 'cat-home',
      brandId: 'brand-moo',
      images: [
        { id: 'img-3', productId: 'prod-lamp', url: '/src/assets/images/moo_hero_lifestyle_1793502193397.jpg', sortOrder: 0, alt: 'Brass orb lamp on wooden console' }
      ],
      variants: [
        { id: 'var-lamp-brass', productId: 'prod-lamp', name: 'Brushed Brass', sku: 'MOO-LGT-003-BRS', price: 120, stock: 4, options: { color: 'Brushed Brass' } }
      ],
      tags: ['Lighting', 'Brass', 'Ambient', 'Dimmable'],
      createdAt: '2026-09-22T08:00:00Z',
    },
    {
      id: 'prod-headphones',
      name: 'Studio Wireless ANC Over-Ear Headphones',
      slug: 'studio-wireless-anc-headphones',
      description: 'Custom 40mm beryllium drivers delivering acoustic fidelity with adaptive active noise cancellation, memory-foam protein leather cushions, and 45-hour battery life.',
      price: 210,
      compareAtPrice: 260,
      costPrice: 110,
      sku: 'KAN-AUD-004',
      stock: 28,
      lowStockAlert: 5,
      isPublished: true,
      rating: 4.9,
      reviewCount: 64,
      categoryId: 'cat-tech',
      brandId: 'brand-kanso',
      images: [
        { id: 'img-4', productId: 'prod-headphones', url: '/src/assets/images/moo_category_tech_1793502193542.jpg', sortOrder: 0, alt: 'Matte black headphones with aluminum desk accessories' }
      ],
      variants: [
        { id: 'var-hp-black', productId: 'prod-headphones', name: 'Matte Charcoal', sku: 'KAN-AUD-004-BLK', price: 210, stock: 18, options: { color: 'Matte Charcoal' } },
        { id: 'var-hp-silver', productId: 'prod-headphones', name: 'Lunar Silver', sku: 'KAN-AUD-004-SLV', price: 210, stock: 10, options: { color: 'Lunar Silver' } }
      ],
      tags: ['Audio', 'Hi-Res', 'Noise Cancelling', 'Wireless'],
      createdAt: '2026-09-25T14:15:00Z',
    },
    {
      id: 'prod-aluminum-stand',
      name: 'Precision Aluminum Headphone Stand & Valet',
      slug: 'precision-aluminum-headphone-stand',
      description: 'Milled from a single block of aerospace-grade aluminum with weighted non-slip silicone base and integrated pen valet tray.',
      price: 48,
      compareAtPrice: 60,
      costPrice: 22,
      sku: 'KAN-ACC-005',
      stock: 40,
      lowStockAlert: 10,
      isPublished: true,
      rating: 4.7,
      reviewCount: 31,
      categoryId: 'cat-tech',
      brandId: 'brand-kanso',
      images: [
        { id: 'img-5', productId: 'prod-aluminum-stand', url: '/src/assets/images/moo_category_tech_1793502193542.jpg', sortOrder: 0, alt: 'Aluminum desk stand and valet' }
      ],
      variants: [
        { id: 'var-stand-gray', productId: 'prod-aluminum-stand', name: 'Space Gray', sku: 'KAN-ACC-005-GRY', price: 48, stock: 40, options: { color: 'Space Gray' } }
      ],
      tags: ['Desk Setup', 'Aluminum', 'Minimalist'],
      createdAt: '2026-09-28T16:00:00Z',
    },
    {
      id: 'prod-sweater',
      name: 'Organic Heavyweight Ribbed Crewneck',
      slug: 'organic-heavyweight-ribbed-crewneck',
      description: 'Knit from 450 GSM certified organic combed cotton with durable double-stitched seams, drop shoulder cut, and pre-shrunk wash.',
      price: 64,
      compareAtPrice: 85,
      costPrice: 28,
      sku: 'MOO-APP-006',
      stock: 52,
      lowStockAlert: 10,
      isPublished: true,
      rating: 4.8,
      reviewCount: 47,
      categoryId: 'cat-apparel',
      brandId: 'brand-moo',
      images: [
        { id: 'img-6', productId: 'prod-sweater', url: '/src/assets/images/moo_category_apparel_1793502194110.jpg', sortOrder: 0, alt: 'Organic heavyweight ribbed crewneck folded on slate' }
      ],
      variants: [
        { id: 'var-sw-s', productId: 'prod-sweater', name: 'Heather Gray / Small', sku: 'MOO-APP-006-S', price: 64, stock: 12, options: { size: 'S', color: 'Heather Gray' } },
        { id: 'var-sw-m', productId: 'prod-sweater', name: 'Heather Gray / Medium', sku: 'MOO-APP-006-M', price: 64, stock: 20, options: { size: 'M', color: 'Heather Gray' } },
        { id: 'var-sw-l', productId: 'prod-sweater', name: 'Heather Gray / Large', sku: 'MOO-APP-006-L', price: 64, stock: 15, options: { size: 'L', color: 'Heather Gray' } },
        { id: 'var-sw-xl', productId: 'prod-sweater', name: 'Heather Gray / XL', sku: 'MOO-APP-006-XL', price: 64, stock: 5, options: { size: 'XL', color: 'Heather Gray' } }
      ],
      tags: ['Organic Cotton', 'Apparel', 'Everyday Luxury'],
      createdAt: '2026-10-01T09:00:00Z',
    },
    {
      id: 'prod-wallet',
      name: 'Full-Grain Vegetable Tanned Leather Bifold',
      slug: 'full-grain-leather-bifold-wallet',
      description: 'Hand-burnished Italian vegetable-tanned leather that develops a rich, singular patina with time. Accommodates 8 cards plus unfolded cash without bulk.',
      price: 45,
      compareAtPrice: 55,
      costPrice: 18,
      sku: 'MOO-APP-007',
      stock: 25,
      lowStockAlert: 5,
      isPublished: true,
      rating: 4.9,
      reviewCount: 38,
      categoryId: 'cat-apparel',
      brandId: 'brand-moo',
      images: [
        { id: 'img-7', productId: 'prod-wallet', url: '/src/assets/images/moo_category_apparel_1793502194110.jpg', sortOrder: 0, alt: 'Leather wallet next to folded sweater' }
      ],
      variants: [
        { id: 'var-wal-cognac', productId: 'prod-wallet', name: 'Cognac Brown', sku: 'MOO-APP-007-BRN', price: 45, stock: 15, options: { color: 'Cognac Brown' } },
        { id: 'var-wal-noir', productId: 'prod-wallet', name: 'Noir Black', sku: 'MOO-APP-007-BLK', price: 45, stock: 10, options: { color: 'Noir Black' } }
      ],
      tags: ['Leather', 'Handmade', 'Accessories'],
      createdAt: '2026-10-05T12:00:00Z',
    },
    {
      id: 'prod-oil',
      name: 'Botanica Pure Balancing Face Oil (30ml)',
      slug: 'botanica-pure-balancing-face-oil',
      description: 'Cold-pressed organic squalane, rosehip seed oil, and botanical jojoba infused with bergamot and neroli. Nourishes skin moisture barrier with zero greasy residue.',
      price: 42,
      compareAtPrice: 52,
      costPrice: 14,
      sku: 'BOT-WEL-008',
      stock: 32,
      lowStockAlert: 8,
      isPublished: true,
      rating: 5.0,
      reviewCount: 53,
      categoryId: 'cat-wellness',
      brandId: 'brand-botanica',
      images: [
        { id: 'img-8', productId: 'prod-oil', url: '/src/assets/images/moo_category_wellness_1793502193873.jpg', sortOrder: 0, alt: 'Botanica face oil dropper on travertine with wooden comb' }
      ],
      variants: [
        { id: 'var-oil-30', productId: 'prod-oil', name: '30ml Glass Dropper', sku: 'BOT-WEL-008-30', price: 42, stock: 32, options: { size: '30ml' } }
      ],
      tags: ['Organic', 'Skincare', 'Clean Beauty', 'Vegan'],
      createdAt: '2026-10-08T15:30:00Z',
    }
  ];

  const reviews: Review[] = [
    {
      id: 'rev-1',
      productId: 'prod-kettle',
      userId: 'usr-customer-1',
      userName: 'Elena Rostova',
      rating: 5,
      title: 'Remarkable craftsmanship and water control',
      comment: 'The matte finish feels incredible in the hands. The temperature accuracy is spot on for pour-over coffee, and it looks like a sculpture on the counter.',
      isVerifiedPurchase: true,
      isApproved: true,
      createdAt: '2026-10-12T14:22:00Z',
    },
    {
      id: 'rev-2',
      productId: 'prod-headphones',
      userId: 'usr-customer-1',
      userName: 'Elena Rostova',
      rating: 5,
      title: 'Sound stage is crisp and pristine',
      comment: 'Replaced my older studio cans with these. The ANC blocks out open-office noise completely without feeling like there is pressure in your ears.',
      isVerifiedPurchase: true,
      isApproved: true,
      createdAt: '2026-10-18T09:10:00Z',
    },
    {
      id: 'rev-3',
      productId: 'prod-sweater',
      userId: 'usr-customer-2',
      userName: 'Marcus Vance',
      rating: 5,
      title: 'Heavyweight organic cotton done right',
      comment: 'The weight of the cotton is substantial and holds its drape even after multiple washes. True to size with a comfortable relaxed silhouette.',
      isVerifiedPurchase: true,
      isApproved: true,
      createdAt: '2026-10-21T18:40:00Z',
    }
  ];

  const orders: Order[] = [
    {
      id: 'ord-1001',
      orderNumber: 'MOO-94812',
      userId: 'usr-customer-1',
      customerEmail: 'customer@moo.store',
      customerName: 'Elena Rostova',
      shippingAddress: {
        id: 'addr-1',
        userId: 'usr-customer-1',
        fullName: 'Elena Rostova',
        phone: '+1 (555) 234-5678',
        line1: '742 Evergreen Terrace',
        line2: 'Apt 4B',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'United States',
        isDefault: true,
      },
      items: [
        {
          id: 'item-1',
          productId: 'prod-kettle',
          variantId: 'var-kettle-bone',
          name: 'Moo Arc Matte Ceramic Electric Kettle (Bone White)',
          price: 78,
          quantity: 1,
          image: '/src/assets/images/moo_hero_lifestyle_1793502193397.jpg',
        },
        {
          id: 'item-2',
          productId: 'prod-oil',
          variantId: 'var-oil-30',
          name: 'Botanica Pure Balancing Face Oil (30ml)',
          price: 42,
          quantity: 1,
          image: '/src/assets/images/moo_category_wellness_1793502193873.jpg',
        }
      ],
      subtotal: 120,
      tax: 9.6,
      shippingCost: 0,
      discount: 12,
      total: 117.6,
      status: 'DELIVERED',
      paymentMethod: 'STRIPE',
      paymentStatus: 'PAID',
      trackingNumber: '1Z9999999999999999',
      timeline: [
        { status: 'PENDING', timestamp: '2026-10-10T11:00:00Z', note: 'Order placed by customer' },
        { status: 'PAID', timestamp: '2026-10-10T11:02:00Z', note: 'Payment verified via Stripe (test mode)' },
        { status: 'PACKED', timestamp: '2026-10-10T15:30:00Z', note: 'Order packed in sustainable packaging' },
        { status: 'SHIPPED', timestamp: '2026-10-11T09:15:00Z', note: 'Departed fulfillment hub via Express' },
        { status: 'DELIVERED', timestamp: '2026-10-13T14:45:00Z', note: 'Delivered at front porch' }
      ],
      createdAt: '2026-10-10T11:00:00Z',
    },
    {
      id: 'ord-1002',
      orderNumber: 'MOO-94825',
      userId: 'usr-customer-2',
      customerEmail: 'marcus.v@example.com',
      customerName: 'Marcus Vance',
      shippingAddress: {
        id: 'addr-2',
        userId: 'usr-customer-2',
        fullName: 'Marcus Vance',
        phone: '+1 (555) 876-5432',
        line1: '120 Market St',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'United States',
        isDefault: true,
      },
      items: [
        {
          id: 'item-3',
          productId: 'prod-headphones',
          variantId: 'var-hp-black',
          name: 'Studio Wireless ANC Over-Ear Headphones (Matte Charcoal)',
          price: 210,
          quantity: 1,
          image: '/src/assets/images/moo_category_tech_1793502193542.jpg',
        }
      ],
      subtotal: 210,
      tax: 16.8,
      shippingCost: 0,
      discount: 0,
      total: 226.8,
      status: 'SHIPPED',
      paymentMethod: 'STRIPE',
      paymentStatus: 'PAID',
      trackingNumber: '9400100000000000000000',
      timeline: [
        { status: 'PENDING', timestamp: '2026-10-28T08:30:00Z', note: 'Order placed' },
        { status: 'PAID', timestamp: '2026-10-28T08:31:00Z', note: 'Payment processed' },
        { status: 'PACKED', timestamp: '2026-10-28T14:00:00Z', note: 'Ready for carrier handover' },
        { status: 'SHIPPED', timestamp: '2026-10-29T10:00:00Z', note: 'In transit to carrier destination sorting center' }
      ],
      createdAt: '2026-10-28T08:30:00Z',
    }
  ];

  const coupons: Coupon[] = [
    {
      id: 'coup-1',
      code: 'WELCOME10',
      type: 'PERCENT',
      value: 10,
      minOrder: 40,
      maxUses: 500,
      usedCount: 23,
      isActive: true,
    },
    {
      id: 'coup-2',
      code: 'MOO20',
      type: 'FIXED',
      value: 20,
      minOrder: 100,
      maxUses: 100,
      usedCount: 14,
      isActive: true,
    },
    {
      id: 'coup-3',
      code: 'FREESHIP',
      type: 'FIXED',
      value: 8,
      minOrder: 30,
      maxUses: 200,
      usedCount: 9,
      isActive: true,
    }
  ];

  const inventoryLogs: InventoryLog[] = [
    {
      id: 'inv-1',
      productId: 'prod-kettle',
      productName: 'Moo Arc Matte Ceramic Electric Kettle',
      changeAmount: 50,
      newStock: 50,
      reason: 'Initial stock intake from factory',
      adminName: 'Admin System',
      createdAt: '2026-09-15T10:00:00Z',
    },
    {
      id: 'inv-2',
      productId: 'prod-kettle',
      productName: 'Moo Arc Matte Ceramic Electric Kettle',
      changeAmount: -1,
      newStock: 34,
      reason: 'Order MOO-94812 fulfillment',
      adminName: 'System Automated',
      createdAt: '2026-10-10T11:00:00Z',
    },
    {
      id: 'inv-3',
      productId: 'prod-lamp',
      productName: 'Architectural Brass & Glass Orb Lamp',
      changeAmount: -1,
      newStock: 4,
      reason: 'Showroom display unit reserved',
      adminName: 'Alex Moore',
      createdAt: '2026-10-24T16:20:00Z',
    }
  ];

  const shippingZones: ShippingZone[] = [
    {
      id: 'sz-us',
      name: 'United States Standard',
      countries: ['United States'],
      rate: 8,
      freeThreshold: 75,
    },
    {
      id: 'sz-us-exp',
      name: 'United States Express (2-Day)',
      countries: ['United States'],
      rate: 18,
      freeThreshold: 150,
    },
    {
      id: 'sz-intl',
      name: 'International Air Delivery',
      countries: ['Canada', 'United Kingdom', 'Germany', 'Australia', 'Japan'],
      rate: 35,
      freeThreshold: 200,
    }
  ];

  const banners: Banner[] = [
    {
      id: 'ban-hero-1',
      title: 'Thoughtfully Curated Essentials For Modern Living',
      subtitle: 'Sculptural objects, precision tools, and everyday staples built to endure.',
      image: '/src/assets/images/moo_hero_lifestyle_1793502193397.jpg',
      link: '/catalog',
      position: 0,
      isActive: true,
    }
  ];

  const settings: StoreSettings = {
    storeName: 'MOO',
    currency: 'USD',
    currencySymbol: '$',
    taxRate: 0.08,
    freeShippingThreshold: 75,
    supportEmail: 'support@moo.store',
    supportPhone: '+1 (800) 555-0199',
    address: '452 Broadway, New York, NY 10013',
  };

  return {
    users: [
      {
        id: 'usr-admin-1',
        email: 'admin@moo.store',
        passwordHash: adminPasswordHash,
        name: 'Alex Moore',
        role: 'ADMIN',
        isBlocked: false,
        createdAt: '2026-09-01T00:00:00Z',
      },
      {
        id: 'usr-customer-1',
        email: 'customer@moo.store',
        passwordHash: customerPasswordHash,
        name: 'Elena Rostova',
        role: 'CUSTOMER',
        isBlocked: false,
        createdAt: '2026-09-05T00:00:00Z',
      },
      {
        id: 'usr-customer-2',
        email: 'marcus.v@example.com',
        passwordHash: customerPasswordHash,
        name: 'Marcus Vance',
        role: 'CUSTOMER',
        isBlocked: false,
        createdAt: '2026-09-12T00:00:00Z',
      }
    ],
    addresses: [
      {
        id: 'addr-1',
        userId: 'usr-customer-1',
        fullName: 'Elena Rostova',
        phone: '+1 (555) 234-5678',
        line1: '742 Evergreen Terrace',
        line2: 'Apt 4B',
        city: 'Portland',
        state: 'OR',
        postalCode: '97201',
        country: 'United States',
        isDefault: true,
      }
    ],
    categories,
    brands,
    products,
    reviews,
    orders,
    coupons,
    inventoryLogs,
    shippingZones,
    banners,
    settings,
    carts: [],
    wishlists: [
      {
        userId: 'usr-customer-1',
        productIds: ['prod-lamp', 'prod-wallet'],
      }
    ]
  };
}

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Could not read existing database file, initializing seed:', err);
    }

    const initial = createInitialDatabase();
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // --- Users ---
  getUsers() { return this.data.users; }
  findUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }
  findUserById(id: string) {
    return this.data.users.find(u => u.id === id);
  }
  createUser(userData: Omit<User, 'id' | 'createdAt'> & { passwordHash: string }) {
    const newUser = {
      ...userData,
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }
  updateUser(id: string, updates: Partial<User>) {
    const user = this.findUserById(id);
    if (!user) return null;
    Object.assign(user, updates);
    this.save();
    return user;
  }
  setUserPassword(id: string, passwordHash: string) {
    const user = this.findUserById(id);
    if (!user) return null;
    user.passwordHash = passwordHash;
    this.save();
    return user;
  }

  // --- Addresses ---
  getAddresses(userId: string) {
    return this.data.addresses.filter(a => a.userId === userId);
  }
  createAddress(addressData: Omit<Address, 'id'>) {
    if (addressData.isDefault) {
      this.data.addresses.forEach(a => {
        if (a.userId === addressData.userId) a.isDefault = false;
      });
    }
    const newAddr: Address = {
      ...addressData,
      id: `addr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    this.data.addresses.push(newAddr);
    this.save();
    return newAddr;
  }
  updateAddress(id: string, userId: string, updates: Partial<Address>) {
    const addr = this.data.addresses.find(a => a.id === id && a.userId === userId);
    if (!addr) return null;
    if (updates.isDefault) {
      this.data.addresses.forEach(a => {
        if (a.userId === userId) a.isDefault = false;
      });
    }
    Object.assign(addr, updates);
    this.save();
    return addr;
  }
  deleteAddress(id: string, userId: string) {
    const index = this.data.addresses.findIndex(a => a.id === id && a.userId === userId);
    if (index === -1) return false;
    this.data.addresses.splice(index, 1);
    this.save();
    return true;
  }

  // --- Categories & Brands ---
  getCategories() { return this.data.categories; }
  findCategoryBySlug(slug: string) { return this.data.categories.find(c => c.slug === slug); }
  findCategoryById(id: string) { return this.data.categories.find(c => c.id === id); }
  createCategory(category: Omit<Category, 'id'>) {
    const newCat = {
      ...category,
      id: `cat-${Date.now()}`,
    };
    this.data.categories.push(newCat);
    this.save();
    return newCat;
  }
  updateCategory(id: string, updates: Partial<Category>) {
    const cat = this.findCategoryById(id);
    if (!cat) return null;
    Object.assign(cat, updates);
    this.save();
    return cat;
  }
  deleteCategory(id: string) {
    const index = this.data.categories.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.data.categories.splice(index, 1);
    this.save();
    return true;
  }

  getBrands() { return this.data.brands; }
  findBrandById(id: string) { return this.data.brands.find(b => b.id === id); }
  createBrand(brand: Omit<Brand, 'id'>) {
    const newBrand = {
      ...brand,
      id: `brand-${Date.now()}`,
    };
    this.data.brands.push(newBrand);
    this.save();
    return newBrand;
  }
  updateBrand(id: string, updates: Partial<Brand>) {
    const b = this.findBrandById(id);
    if (!b) return null;
    Object.assign(b, updates);
    this.save();
    return b;
  }
  deleteBrand(id: string) {
    const index = this.data.brands.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.data.brands.splice(index, 1);
    this.save();
    return true;
  }

  // --- Products ---
  getProducts(params?: {
    categorySlug?: string;
    brandId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStockOnly?: boolean;
    sortBy?: 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'name';
    page?: number;
    limit?: number;
    includeUnpublished?: boolean;
  }) {
    let list = this.data.products.slice();

    if (!params?.includeUnpublished) {
      list = list.filter(p => p.isPublished);
    }

    if (params?.categorySlug) {
      const cat = this.findCategoryBySlug(params.categorySlug);
      if (cat) {
        list = list.filter(p => p.categoryId === cat.id);
      }
    }

    if (params?.brandId) {
      list = list.filter(p => p.brandId === params.brandId);
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (params?.minPrice !== undefined) {
      list = list.filter(p => p.price >= (params.minPrice || 0));
    }
    if (params?.maxPrice !== undefined) {
      list = list.filter(p => p.price <= (params.maxPrice || Infinity));
    }
    if (params?.minRating !== undefined) {
      list = list.filter(p => p.rating >= (params.minRating || 0));
    }
    if (params?.inStockOnly) {
      list = list.filter(p => p.stock > 0);
    }

    // Sorting
    const sort = params?.sortBy || 'newest';
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list.sort((a, b) => b.rating - a.rating);
    else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = list.length;
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    const startIndex = (page - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    // Hydrate category and brand
    const hydrated = paginated.map(p => ({
      ...p,
      category: this.findCategoryById(p.categoryId),
      brand: this.findBrandById(p.brandId),
    }));

    return {
      products: hydrated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  findProductById(id: string) {
    const p = this.data.products.find(item => item.id === id);
    if (!p) return null;
    return {
      ...p,
      category: this.findCategoryById(p.categoryId),
      brand: this.findBrandById(p.brandId),
      reviews: this.getReviewsByProductId(p.id),
    };
  }

  findProductBySlug(slug: string) {
    const p = this.data.products.find(item => item.slug === slug);
    if (!p) return null;
    return {
      ...p,
      category: this.findCategoryById(p.categoryId),
      brand: this.findBrandById(p.brandId),
      reviews: this.getReviewsByProductId(p.id),
    };
  }

  createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'rating' | 'reviewCount'>) {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      rating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      variants: productData.variants || [],
      images: productData.images || [],
    };
    this.data.products.push(newProduct);

    // Log initial inventory
    this.addInventoryLog({
      productId: newProduct.id,
      productName: newProduct.name,
      changeAmount: newProduct.stock,
      newStock: newProduct.stock,
      reason: 'Product created',
      adminName: 'Admin',
    });

    this.save();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<Product>, adminName: string = 'Admin') {
    const product = this.data.products.find(p => p.id === id);
    if (!product) return null;

    if (updates.stock !== undefined && updates.stock !== product.stock) {
      const diff = updates.stock - product.stock;
      this.addInventoryLog({
        productId: product.id,
        productName: product.name,
        changeAmount: diff,
        newStock: updates.stock,
        reason: 'Manual stock adjustment',
        adminName,
      });
    }

    Object.assign(product, updates);
    this.save();
    return product;
  }

  deleteProduct(id: string) {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.data.products.splice(index, 1);
    this.save();
    return true;
  }

  adjustProductStock(productId: string, changeAmount: number, reason: string, adminName: string = 'System') {
    const product = this.data.products.find(p => p.id === productId);
    if (!product) return null;

    product.stock = Math.max(0, product.stock + changeAmount);
    this.addInventoryLog({
      productId: product.id,
      productName: product.name,
      changeAmount,
      newStock: product.stock,
      reason,
      adminName,
    });

    this.save();
    return product;
  }

  // --- Reviews ---
  getReviewsByProductId(productId: string) {
    return this.data.reviews.filter(r => r.productId === productId && r.isApproved);
  }
  getAllReviews() {
    return this.data.reviews;
  }
  createReview(reviewData: Omit<Review, 'id' | 'createdAt'>) {
    const newRev: Review = {
      ...reviewData,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.reviews.push(newRev);

    // Update product average rating
    const product = this.data.products.find(p => p.id === reviewData.productId);
    if (product) {
      const allApproved = this.data.reviews.filter(r => r.productId === product.id && r.isApproved);
      const totalScore = allApproved.reduce((sum, r) => sum + r.rating, 0);
      product.reviewCount = allApproved.length;
      product.rating = allApproved.length > 0 ? Number((totalScore / allApproved.length).toFixed(1)) : 0;
    }

    this.save();
    return newRev;
  }
  updateReviewStatus(id: string, isApproved: boolean) {
    const rev = this.data.reviews.find(r => r.id === id);
    if (!rev) return null;
    rev.isApproved = isApproved;
    this.save();
    return rev;
  }
  deleteReview(id: string) {
    const index = this.data.reviews.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.data.reviews.splice(index, 1);
    this.save();
    return true;
  }

  // --- Orders ---
  getOrders(params?: { userId?: string; status?: OrderStatus; search?: string }) {
    let list = this.data.orders.slice();
    if (params?.userId) {
      list = list.filter(o => o.userId === params.userId);
    }
    if (params?.status) {
      list = list.filter(o => o.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
      );
    }
    // newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }

  findOrderById(id: string) {
    return this.data.orders.find(o => o.id === id);
  }

  findOrderByOrderNumber(num: string) {
    return this.data.orders.find(o => o.orderNumber === num);
  }

  createOrder(orderData: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'timeline'> & { timelineNote?: string }) {
    const orderNumber = `MOO-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: now,
      timeline: [
        {
          status: orderData.status || 'PENDING',
          timestamp: now,
          note: orderData.timelineNote || 'Order placed successfully',
        }
      ],
    };

    // Decrement stock for purchased items
    for (const item of newOrder.items) {
      this.adjustProductStock(
        item.productId,
        -item.quantity,
        `Purchased in order ${orderNumber}`,
        'System Automated'
      );
    }

    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  updateOrderStatus(orderId: string, status: OrderStatus, note?: string, trackingNumber?: string) {
    const order = this.findOrderById(orderId);
    if (!order) return null;

    order.status = status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    if (status === 'PAID') {
      order.paymentStatus = 'PAID';
    }

    order.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Order status updated to ${status}`,
    });

    this.save();
    return order;
  }

  processOrderRefund(orderId: string, reason: string, restock: boolean = true) {
    const order = this.findOrderById(orderId);
    if (!order) return null;

    order.status = 'REFUNDED';
    order.paymentStatus = 'REFUNDED';
    order.timeline.push({
      status: 'REFUNDED',
      timestamp: new Date().toISOString(),
      note: `Refund processed: ${reason}`,
    });

    if (restock) {
      for (const item of order.items) {
        this.adjustProductStock(
          item.productId,
          item.quantity,
          `Restocked from refunded order ${order.orderNumber}`,
          'Admin'
        );
      }
    }

    this.save();
    return order;
  }

  // --- Cart ---
  getCart(token?: string, userId?: string | null): StoredCart {
    let cart: StoredCart | undefined;
    if (userId) {
      cart = this.data.carts.find(c => c.userId === userId);
    }
    if (!cart && token) {
      cart = this.data.carts.find(c => c.token === token);
    }

    if (!cart) {
      cart = {
        id: `cart-${Date.now()}`,
        token: token || `tok-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        userId: userId || null,
        items: [],
        couponCode: null,
        updatedAt: new Date().toISOString(),
      };
      this.data.carts.push(cart);
      this.save();
    } else if (userId && !cart.userId) {
      cart.userId = userId;
      this.save();
    }

    return cart;
  }

  updateCart(cart: StoredCart) {
    cart.updatedAt = new Date().toISOString();
    const index = this.data.carts.findIndex(c => c.id === cart.id);
    if (index >= 0) {
      this.data.carts[index] = cart;
    } else {
      this.data.carts.push(cart);
    }
    this.save();
    return cart;
  }

  clearCart(cartId: string) {
    const cart = this.data.carts.find(c => c.id === cartId);
    if (cart) {
      cart.items = [];
      cart.couponCode = null;
      cart.updatedAt = new Date().toISOString();
      this.save();
    }
  }

  // --- Wishlist ---
  getWishlist(userId: string): string[] {
    const w = this.data.wishlists.find(item => item.userId === userId);
    return w ? w.productIds : [];
  }

  toggleWishlist(userId: string, productId: string): string[] {
    let w = this.data.wishlists.find(item => item.userId === userId);
    if (!w) {
      w = { userId, productIds: [] };
      this.data.wishlists.push(w);
    }
    if (w.productIds.includes(productId)) {
      w.productIds = w.productIds.filter(id => id !== productId);
    } else {
      w.productIds.push(productId);
    }
    this.save();
    return w.productIds;
  }

  // --- Coupons ---
  getCoupons() { return this.data.coupons; }
  findCouponByCode(code: string) {
    return this.data.coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
  }
  createCoupon(couponData: Omit<Coupon, 'id' | 'usedCount'>) {
    const newCoupon: Coupon = {
      ...couponData,
      id: `coup-${Date.now()}`,
      code: couponData.code.toUpperCase().trim(),
      usedCount: 0,
    };
    this.data.coupons.push(newCoupon);
    this.save();
    return newCoupon;
  }
  updateCoupon(id: string, updates: Partial<Coupon>) {
    const coup = this.data.coupons.find(c => c.id === id);
    if (!coup) return null;
    if (updates.code) updates.code = updates.code.toUpperCase().trim();
    Object.assign(coup, updates);
    this.save();
    return coup;
  }
  deleteCoupon(id: string) {
    const index = this.data.coupons.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.data.coupons.splice(index, 1);
    this.save();
    return true;
  }
  incrementCouponUse(code: string) {
    const coup = this.findCouponByCode(code);
    if (coup) {
      coup.usedCount += 1;
      this.save();
    }
  }

  // --- Inventory Logs ---
  getInventoryLogs() {
    return this.data.inventoryLogs.slice().sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  addInventoryLog(log: Omit<InventoryLog, 'id' | 'createdAt'>) {
    const newLog: InventoryLog = {
      ...log,
      id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.inventoryLogs.unshift(newLog);
    this.save();
    return newLog;
  }

  // --- Shipping Zones ---
  getShippingZones() { return this.data.shippingZones; }
  findShippingZoneById(id: string) { return this.data.shippingZones.find(sz => sz.id === id); }
  createShippingZone(zone: Omit<ShippingZone, 'id'>) {
    const newZone = { ...zone, id: `sz-${Date.now()}` };
    this.data.shippingZones.push(newZone);
    this.save();
    return newZone;
  }
  updateShippingZone(id: string, updates: Partial<ShippingZone>) {
    const zone = this.findShippingZoneById(id);
    if (!zone) return null;
    Object.assign(zone, updates);
    this.save();
    return zone;
  }
  deleteShippingZone(id: string) {
    const index = this.data.shippingZones.findIndex(z => z.id === id);
    if (index === -1) return false;
    this.data.shippingZones.splice(index, 1);
    this.save();
    return true;
  }

  // --- Banners ---
  getBanners(activeOnly: boolean = true) {
    let list = this.data.banners.slice();
    if (activeOnly) list = list.filter(b => b.isActive);
    return list.sort((a, b) => a.position - b.position);
  }
  createBanner(banner: Omit<Banner, 'id'>) {
    const newBanner = { ...banner, id: `ban-${Date.now()}` };
    this.data.banners.push(newBanner);
    this.save();
    return newBanner;
  }
  updateBanner(id: string, updates: Partial<Banner>) {
    const banner = this.data.banners.find(b => b.id === id);
    if (!banner) return null;
    Object.assign(banner, updates);
    this.save();
    return banner;
  }
  deleteBanner(id: string) {
    const index = this.data.banners.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.data.banners.splice(index, 1);
    this.save();
    return true;
  }

  // --- Store Settings ---
  getSettings() { return this.data.settings; }
  updateSettings(updates: Partial<StoreSettings>) {
    Object.assign(this.data.settings, updates);
    this.save();
    return this.data.settings;
  }
}

export const db = new Database();
