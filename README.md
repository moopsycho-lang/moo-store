# MOO — Modern Objects & Lifestyle E-Commerce Platform

A production-grade, full-stack e-commerce web application where customers can buy curated lifestyle objects, furniture, audio equipment, and staples, complete with an administrative dashboard for full-spectrum store fulfillment and analytics.

---

## 1. Project Folder Structure

```
├── .env.example                     # Environment variables template
├── index.html                       # HTML5 entry point with OpenGraph & font links
├── metadata.json                    # App metadata and capability configuration
├── package.json                     # Scripts and dependencies
├── server.ts                        # Full-stack Express server integrating REST API + Vite
├── tsconfig.json                    # TypeScript compiler configuration
├── vite.config.ts                   # Vite bundler & Tailwind v4 plugin setup
├── prisma/
│   ├── schema.prisma                # Full PostgreSQL Prisma ORM schema
│   └── migrations/
│       └── 20261031_init/
│           └── migration.sql        # Initial database SQL migration
├── src/
│   ├── index.css                    # Tailwind v4 configuration & theme tokens
│   ├── main.tsx                     # React 19 client bootstrap
│   ├── App.tsx                      # Root component, router, and context provider tree
│   ├── assets/
│   │   └── images/                  # Commercial generated photography assets
│   ├── types/
│   │   └── index.ts                 # Shared TypeScript models and API types
│   ├── server/
│   │   ├── db.ts                    # Relational file-persisted database engine with seed data
│   │   ├── auth.ts                  # JWT token management, bcrypt, and RBAC middleware
│   │   └── routes/
│   │       ├── auth.ts              # Register, login, refresh, profile, password reset
│   │       ├── products.ts          # Catalog browsing, filtering, search, and reviews
│   │       ├── cart.ts              # Persistent bag, coupons, tax, and shipping math
│   │       ├── orders.ts            # Stripe & COD checkout, tracking, reorders, returns
│   │       ├── user.ts              # Saved addresses, profile, and wishlist
│   │       └── admin.ts             # Analytics, product CRUD, orders, customers, inventory
│   └── client/
│       ├── context/
│       │   ├── ThemeContext.tsx     # Light/dark mode toggle
│       │   ├── ToastContext.tsx     # Toast notification alerts
│       │   ├── AuthContext.tsx      # Auth state, login/register, 1-click demo logins
│       │   ├── CartContext.tsx      # Shopping bag state and slide-over drawer
│       │   └── WishlistContext.tsx  # Saved wishlist items
│       ├── components/
│       │   ├── Header.tsx           # 3-Zone Top Bar Contract with search autocomplete
│       │   ├── Footer.tsx           # Editorial footer with guarantees and store info
│       │   ├── ProductCard.tsx      # 4:3 product card with tabular price numerals
│       │   ├── CartDrawer.tsx       # Slide-over bag with free shipping tracker & coupons
│       │   ├── WishlistDrawer.tsx   # Slide-over saved wishlist drawer
│       │   ├── AuthModal.tsx        # Customer and admin sign-in modal
│       │   └── InvoiceModal.tsx     # Official printable commercial invoice and packing slip
│       └── pages/
│           ├── HomePage.tsx         # Campaign hero banner, categories, and flash sales
│           ├── CatalogPage.tsx      # Category tabs, sidebar filters, sorting, pagination
│           ├── ProductDetailPage.tsx# PDP with sticky purchase module, variants, reviews
│           ├── CheckoutPage.tsx     # 3-step checkout: address, carrier, Stripe test/COD
│           ├── OrderConfirmationPage.tsx # Post-order screen with live tracking timeline
│           ├── AccountPage.tsx      # Orders history, tracking, reorder, address book
│           └── AdminDashboard.tsx   # Admin overview KPIs, product CRUD, orders, refunds
```

---

## 2. Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend**: Node.js, Express, Zod validation, JWT (Access & Refresh tokens), bcrypt.
- **Database**:
  - Embedded persistent relational engine (`data/moo_db.json`) for instant zero-latency development and sandbox stability.
  - Production `schema.prisma` and PostgreSQL migration scripts for cloud deployments.
- **Payments**: Stripe Test Mode card simulation + Cash on Delivery (COD) payment flow.
- **Design**: Strict 3-zone header contract, 60-30-10 color discipline, zero-pill metadata, tabular numerals (`font-mono tabular-nums`), responsive mobile-first architecture with dark mode.

---

## 3. Demo Credentials

The database automatically seeds with realistic test accounts:

| Role | Email | Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@moo.store` | `admin123` | Full admin dashboard `/admin`, product CRUD, stock adjustment, order status updates, refund processing, customer account blocking |
| **Customer** | `customer@moo.store` | `password123` | Storefront checkout, order history with tracking timeline, saved address book, review submissions, wishlist |

*Tip: The Sign In modal includes **1-Click Demo Buttons** for instant evaluation.*

---

## 4. REST API Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/register`
  - Body: `{ "name": "Elena", "email": "elena@example.com", "password": "password123" }`
  - Response: `{ "user": {...}, "accessToken": "..." }`
- `POST /api/auth/login`
  - Body: `{ "email": "customer@moo.store", "password": "password123" }`
  - Response: `{ "user": {...}, "accessToken": "..." }`
- `POST /api/auth/refresh`
  - Refreshes access token via HTTP-only cookie or bearer token.
- `GET /api/auth/me`
  - Returns current authenticated user profile.
- `POST /api/auth/forgot-password` & `POST /api/auth/reset-password`
  - Generates and consumes password reset tokens.

### Products & Catalog (`/api/products`)
- `GET /api/products`
  - Query params: `category`, `brand`, `search`, `minPrice`, `maxPrice`, `minRating`, `inStock`, `sortBy`, `page`, `limit`
  - Response: `{ "products": [...], "total": 8, "page": 1, "totalPages": 1 }`
- `GET /api/products/slug/:slug`
  - Returns product with variants, images, reviews, and related objects.
- `GET /api/products/trending` & `GET /api/products/deals` & `GET /api/products/new-arrivals`
- `POST /api/products/:id/reviews` (Requires Auth)
  - Body: `{ "rating": 5, "title": "Great quality", "comment": "..." }`

### Shopping Bag (`/api/cart`)
- `GET /api/cart`
  - Returns populated cart with subtotal, discount, tax (8%), shipping, and total.
- `POST /api/cart/items`
  - Body: `{ "productId": "prod-kettle", "variantId": "var-kettle-bone", "quantity": 1 }`
- `PUT /api/cart/items/:itemId`
  - Body: `{ "quantity": 2 }`
- `DELETE /api/cart/items/:itemId`
- `POST /api/cart/coupon`
  - Body: `{ "code": "WELCOME10" }`

### Orders & Checkout (`/api/orders`)
- `POST /api/orders/calculate`
  - Calculates subtotal, tax, shipping, and discount preview for items.
- `POST /api/orders`
  - Body:
    ```json
    {
      "customerName": "Elena Rostova",
      "customerEmail": "customer@moo.store",
      "shippingAddress": {
        "fullName": "Elena Rostova",
        "line1": "742 Evergreen Terrace",
        "city": "Portland",
        "state": "OR",
        "postalCode": "97201",
        "country": "United States"
      },
      "items": [{ "productId": "prod-kettle", "name": "Moo Arc Kettle", "price": 78, "quantity": 1 }],
      "paymentMethod": "STRIPE",
      "couponCode": "WELCOME10"
    }
    ```
- `GET /api/orders`
  - Customer order history with fulfillment status and tracking numbers.
- `GET /api/orders/:identifier`
  - Lookup order by order number (e.g. `MOO-94812`).
- `POST /api/orders/:id/reorder`
  - Re-adds previous order items directly into shopping bag.

### Admin Dashboard (`/api/admin` — Admin role required)
- `GET /api/admin/overview`: Revenue metrics, 7-day velocity chart data, top products.
- `GET /api/admin/products` & `POST /api/admin/products` & `PUT /api/admin/products/:id` & `DELETE /api/admin/products/:id`: Full product CRUD.
- `PUT /api/admin/orders/:id/status`: Update status to `PENDING`, `PAID`, `PACKED`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` with timeline note.
- `POST /api/admin/orders/:id/refund`: Issue refund with optional inventory restocking.
- `GET /api/admin/inventory` & `POST /api/admin/inventory/adjust`: Manual inventory adjustments and audit log.
- `PUT /api/admin/customers/:id/toggle-block`: Block or unblock customer accounts.
- `GET /api/admin/coupons` & `POST /api/admin/coupons`: Manage discount codes.
- `GET /api/admin/reviews` & `PUT /api/admin/reviews/:id/status`: Moderate customer reviews.
- `GET /api/admin/reports`: Category sales breakdown and CSV export.

---

## 5. Running the Application

### Development
```bash
# Start full-stack Express server with Vite middleware on port 3000
npm run dev
```

### Production Build
```bash
# Build frontend assets into /dist
npm run build

# Start production server
npm run start
```
