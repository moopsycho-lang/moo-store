// src/types/index.ts
// Shared models and API request/response types for MOO e-commerce

export type Role = 'CUSTOMER' | 'ADMIN';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod = 'STRIPE' | 'CASH_ON_DELIVERY';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type CouponType = 'PERCENT' | 'FIXED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isBlocked: boolean;
  createdAt: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string | null;
  productCount?: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  options: {
    size?: string;
    color?: string;
    [key: string]: string | undefined;
  };
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt?: string;
  sortOrder: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  stock: number;
  lowStockAlert: number;
  isPublished: boolean;
  rating: number;
  reviewCount: number;
  categoryId: string;
  category?: Category;
  brandId: string;
  brand?: Brand;
  images: ProductImage[];
  variants: ProductVariant[];
  reviews?: Review[];
  tags?: string[];
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  price: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrder?: number;
  maxUses?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface Cart {
  id: string;
  items: CartItem[];
  coupon?: Coupon | null;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string | null;
  customerEmail: string;
  customerName: string;
  shippingAddress: Address;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  trackingNumber?: string;
  timeline: OrderTimelineEvent[];
  createdAt: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  changeAmount: number;
  newStock: number;
  reason: string;
  adminName: string;
  createdAt: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  rate: number;
  freeThreshold?: number;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  link: string;
  position: number;
  isActive: boolean;
}

export interface StoreSettings {
  storeName: string;
  currency: string;
  currencySymbol: string;
  taxRate: number; // e.g., 0.08 for 8%
  freeShippingThreshold: number;
  supportEmail: string;
  supportPhone: string;
  address: string;
}
