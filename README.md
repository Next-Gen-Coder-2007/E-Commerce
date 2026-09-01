# MERN E-Commerce Platform

A modular, microservices-oriented e-commerce backend and frontend architecture featuring an API Gateway, an isolated Authentication Microservice with Redis rate limiting, a unified Product & Catalog Service (with verified customer reviews, merchant replies, and promotional coupon management), a Shopping Cart Service with Redis caching, an Order Fulfillment Service, and a modern React 19 TypeScript client with secure HTTP-only cookie session management.

---

## Overview

This project is an e-commerce platform designed from the ground up to follow an incremental microservices architecture. Rather than building a tightly coupled monolithic application, core domain responsibilities are decoupled into dedicated services communicating behind a single API Gateway:

* **API Gateway**: Provides unified routing, CORS configuration, security headers, distributed correlation IDs, and multi-instance load balancing.
* **Authentication Service**: Handles customer/merchant identity, credential validation, Google OAuth 2.0, password hashing, JWT lifecycle, and Redis rate limiting.
* **Product, Review & Coupon Service**: Centrally manages the product catalog, technical specifications, multi-image Cloudinary galleries, verified customer reviews & photo attachments, merchant responses, and dynamic store & platform coupon campaigns.
* **Shopping Cart Service**: Manages persistent carts for both guest and authenticated users, automatic cart merging upon sign-in, and Redis cache acceleration.
* **Order Management Service**: Powers multi-step checkout, coupon validation and redemption, order tracking timelines, customer order cancellation, and merchant fulfillment dispatch.
* **Modern React Client**: Single-page application built with React 19, TypeScript, Vite, and Tailwind CSS with route guards, dark/light aesthetics, and live real-time sync.

---

## Current Architecture

The platform uses a decoupled client-gateway-service pattern where the frontend interfaces exclusively with the API Gateway.

```mermaid
flowchart TD
    Client["React Frontend (Port 5173)\nTypeScript + Vite + Tailwind CSS"]
    
    subgraph GatewayLayer["API Gateway Layer (Port 5000)"]
        Gateway["Express API Gateway\nReverse Proxy + CORS + Cookies + Load Balancing + Rate Limiting"]
    end

    subgraph ServiceLayer["Service Layer"]
        AuthService["Auth Service (Port 5001)\nExpress + Mongoose + JWT + Google OAuth"]
        ProductService["Product, Review & Coupon Service (Port 5002)\nExpress + Mongoose + Multer + Cloudinary"]
        CartService["Cart Service (Port 5003)\nExpress + Mongoose + Redis Cache"]
        OrderService["Order Service (Port 5004)\nExpress + Mongoose + Fulfillment Tracking"]
    end

    subgraph DataLayer["Persistence & Caching (Same Cluster, Isolated Databases)"]
        AuthDB[("MongoDB: auth\nUsers, Merchant Details, Addresses")]
        ProductDB[("MongoDB: products\nCatalog, Specs, Customer Reviews, Store Coupons")]
        CartDB[("MongoDB: cart\nShopping Carts & Guest Sessions")]
        OrderDB[("MongoDB: orders\nOrders, Tracking & Audit Timelines")]
        Redis[("Upstash Redis (TLS)\nRate Limiting & Cache Acceleration")]
    end

    Client -- "HTTP /api/*\n(Credentials: include)" --> Gateway
    Gateway -- "Proxy /api/auth" --> AuthService
    Gateway -- "Proxy /api/products, /api/reviews, /api/coupons" --> ProductService
    Gateway -- "Proxy /api/cart" --> CartService
    Gateway -- "Proxy /api/orders" --> OrderService
    
    AuthService --> AuthDB
    AuthService -.-> Redis
    ProductService --> ProductDB
    CartService --> CartDB
    CartService -.-> Redis
    OrderService --> OrderDB
    OrderService -.-> ProductService
```

---

## Technology Stack

### Frontend
* **Core**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS (v4), Lucide React icons
* **Networking & State**: Axios (with credentials), Context API
* **Auth**: `@react-oauth/google`

### Backend & Microservices
* **Runtime**: Node.js (ES Modules)
* **Framework**: Express (v5)
* **Routing & Proxy**: `http-proxy-middleware`
* **Security & Utilities**: Helmet, Morgan, Cookie-Parser, CORS, Dotenv, Crypto

### Data & Cloud Storage
* **Databases**: MongoDB Atlas (Mongoose ODM) with Database-per-Service isolation
* **Cache & Rate Limiting**: Upstash Redis (`ioredis`)
* **Media & Cloud CDN**: Cloudinary for product galleries and customer review photos

---

## Project Structure

```text
E-Commerce/
├── client/                               # Frontend Single Page Application
│   ├── src/
│   │   ├── components/                   # Reusable UI components & route guards
│   │   │   ├── business/                 # Merchant navbar and seller components
│   │   │   ├── reviews/                  # Verified reviews feed, ReviewCard, WriteReviewModal
│   │   │   ├── CartDrawer.tsx            # Slide-over interactive shopping cart drawer
│   │   │   ├── CancelOrderModal.tsx      # Multi-step customer cancellation dialog
│   │   │   ├── GoogleAuthButton.tsx      # Google Identity Services button
│   │   │   ├── Navbar.tsx                # Global consumer navigation & badge
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── PublicOnlyRoute.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx           # Authentication state, session restore & address manager
│   │   │   └── CartContext.tsx           # Shopping cart state, actions & guest-to-user merging
│   │   ├── pages/
│   │   │   ├── business/
│   │   │   │   ├── BusinessHomePage.tsx     # Seller Central (Catalog, Inventory, Orders, Reviews, Coupons)
│   │   │   │   ├── BusinessLoginPage.tsx    # Merchant authentication (/business/login)
│   │   │   │   └── BusinessRegisterPage.tsx # Merchant registration (/business/register)
│   │   │   ├── CompanyStorePage.tsx         # Brand storefront with active coupons & flash sales (/store/:id)
│   │   │   ├── HomePage.tsx                 # Retail home & consumer catalog (/)
│   │   │   ├── LoginPage.tsx                # Customer sign-in (/login)
│   │   │   ├── RegisterPage.tsx             # Customer registration (/register)
│   │   │   ├── OrdersPage.tsx               # Order history & verified review launchpad (/orders)
│   │   │   ├── OrderDetailsPage.tsx         # Real-time tracking timeline & review badges (/orders/:id)
│   │   │   ├── CheckoutPage.tsx             # Multi-step checkout & 1-click dynamic coupon drawer
│   │   │   └── ProductDetailPage.tsx        # Product specs, gallery, coupon ribbon & reviews feed
│   │   ├── services/
│   │   │   ├── api.ts                    # Axios client instance with cookie credentials
│   │   │   ├── authService.ts            # Auth & profile management API
│   │   │   ├── cartService.ts            # Cart API client & guest tracking
│   │   │   ├── couponService.ts          # Coupon validation, redemption & merchant CRUD API
│   │   │   ├── orderService.ts           # Order creation, cancellation & tracking API
│   │   │   ├── productService.ts         # Product catalog, specs & storefront API
│   │   │   └── reviewService.ts          # Customer reviews, helpful votes & merchant replies API
│   │   ├── types/
│   │   │   ├── auth.ts                   # Auth & address TypeScript interfaces
│   │   │   ├── cart.ts                   # Cart and CartItem definitions
│   │   │   ├── coupon.ts                 # Coupon, discount types & validation definitions
│   │   │   ├── order.ts                  # Order, payment, fulfillment & status types
│   │   │   ├── product.ts                # Product, specifications & storefront types
│   │   │   └── review.ts                 # Review, rating breakdown & merchant reply types
│   │   ├── App.tsx                       # Client router configuration
│   │   ├── index.css                     # Tailwind CSS entry
│   │   └── main.tsx                      # Bootstrap entry
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── gateway/                              # Modular API Gateway (Port 5000)
│   ├── config/
│   │   ├── redis.js                      # Redis client for gateway rate limiting
│   │   └── services.js                   # Unified microservices registry
│   ├── middleware/
│   │   ├── authGateway.js                # Token verification & user header injection
│   │   ├── loadBalancer.js               # Multi-instance round-robin load balancer
│   │   ├── rateLimiter.js                # Gateway-level distributed rate limiter
│   │   ├── logging.js                    # Correlation ID tracking (x-correlation-id)
│   │   └── errorMiddleware.js            # Gateway 404 & error handlers
│   ├── routes/
│   │   ├── proxyHandler.js               # Dynamic reverse proxy handler
│   │   └── index.js                      # Service routing registry (/auth, /products, /reviews, /coupons, /cart, /orders)
│   ├── package.json
│   └── server.js                         # Gateway orchestration server
├── services/                             # Microservices Directory
│   ├── auth-service/                     # Identity & Authentication Service (Port 5001)
│   │   ├── config/ (db.js, redis.js)
│   │   ├── controllers/ (authController.js)
│   │   ├── middleware/ (authMiddleware.js, errorMiddleware.js, rateLimiter.js)
│   │   ├── models/ (User.js)
│   │   ├── routes/ (authRoutes.js)
│   │   └── server.js
│   ├── product-service/                  # Unified Catalog, Reviews & Coupons Service (Port 5002)
│   │   ├── config/ (db.js, cloudinary.js)
│   │   ├── controllers/
│   │   │   ├── productController.js      # Catalog search, category filters, merchant CRUD
│   │   │   ├── reviewController.js       # Customer reviews, rating aggregate, official merchant replies
│   │   │   └── couponController.js       # Store coupons, cart validation, redemption recording
│   │   ├── middleware/ (authCheck.js)
│   │   ├── models/
│   │   │   ├── Product.js                # Product schema (specs, multi-image, discount, stock)
│   │   │   ├── Review.js                 # Review schema (ratings, photos, verified flag, replies)
│   │   │   └── Coupon.js                 # Coupon schema (percentage/fixed, caps, user limits, usedBy)
│   │   ├── routes/
│   │   │   ├── productRoutes.js          # /api/products
│   │   │   ├── reviewRoutes.js           # /api/reviews
│   │   │   └── couponRoutes.js           # /api/coupons
│   │   └── server.js
│   ├── cart-service/                     # Shopping Cart Service (Port 5003)
│   │   ├── config/ (db.js, redis.js)
│   │   ├── controllers/ (cartController.js)
│   │   ├── middleware/ (authCheck.js, errorMiddleware.js)
│   │   ├── models/ (Cart.js)
│   │   ├── routes/ (cartRoutes.js)
│   │   └── server.js
│   ├── order-service/                    # Order Management & Fulfillment Service (Port 5004)
│   │   ├── config/ (db.js, redis.js)
│   │   ├── controllers/ (orderController.js)
│   │   ├── middleware/ (authCheck.js, errorMiddleware.js)
│   │   ├── models/ (Order.js)
│   │   ├── routes/ (orderRoutes.js)
│   │   └── server.js
│   └── package.json                      # Shared microservices dependencies
├── package.json                          # Root repository orchestration scripts
└── README.md
```

---

## Database Architecture (Database-per-Service Pattern)

The platform implements the **Database-per-Service** pattern with strict logical encapsulation across dedicated MongoDB databases within the cluster:

```text
MongoDB Atlas Cluster (cluster0.1pknqka.mongodb.net)
├── auth (Auth Microservice Database)
│   └── users
│       ├── _id: ObjectId
│       ├── name: String
│       ├── email: String (unique, indexed)
│       ├── password: String (bcrypt hash)
│       ├── googleId: String (sparse, indexed)
│       ├── role: String (enum: ['customer', 'company', 'admin'])
│       ├── companyName: String (optional, merchant name)
│       ├── businessDetails: Object (taxId, supportEmail, bankDetails, address)
│       └── savedAddresses: Array (fullName, phone, street, city, state, postalCode, isDefault)
│
├── products (Unified Product Catalog, Reviews & Coupons Database)
│   ├── products
│   │   ├── _id: ObjectId
│   │   ├── title: String (indexed for text search)
│   │   ├── description: String
│   │   ├── price: Number
│   │   ├── originalPrice: Number (for strikethrough sale pricing)
│   │   ├── discountPercentage: Number
│   │   ├── isFlashSale: Boolean
│   │   ├── category: String (electronics, fashion, home, beauty, sports, etc.)
│   │   ├── image: String (Cloudinary primary URL)
│   │   ├── images: Array<String> (Reference gallery URLs)
│   │   ├── specifications: Array<{ key: String, value: String }>
│   │   ├── stock: Number
│   │   ├── companyId: ObjectId (indexed, reference to merchant)
│   │   ├── companyName: String
│   │   ├── rating: Number (aggregated from reviews, 0 if no reviews)
│   │   └── numReviews: Number (count of published customer reviews)
│   │
│   ├── reviews
│   │   ├── _id: ObjectId
│   │   ├── productId: ObjectId (indexed)
│   │   ├── userId: ObjectId (indexed)
│   │   ├── userName: String
│   │   ├── orderId: ObjectId (reference to verified purchase order)
│   │   ├── isVerifiedPurchase: Boolean
│   │   ├── rating: Number (1 to 5)
│   │   ├── title: String (headline)
│   │   ├── comment: String (detailed review body)
│   │   ├── photos: Array<String> (up to 5 Cloudinary URLs)
│   │   ├── helpfulVotes: Number
│   │   ├── helpfulUserIds: Array<ObjectId>
│   │   ├── merchantReply: Object ({ comment, repliedAt, companyId, companyName })
│   │   └── status: String (enum: ['published', 'flagged', 'hidden'])
│   │
│   └── coupons
│       ├── _id: ObjectId
│       ├── code: String (uppercase, unique, indexed)
│       ├── description: String
│       ├── discountType: String (enum: ['percentage', 'fixed'])
│       ├── discountValue: Number
│       ├── minPurchaseAmount: Number (minimum cart subtotal required)
│       ├── maxDiscountAmount: Number (cap for percentage discounts)
│       ├── companyId: ObjectId (null for platform-wide, merchant ID for store-specific)
│       ├── companyName: String
│       ├── applicableProducts: Array<ObjectId> (empty for storewide promo)
│       ├── startDate: Date
│       ├── endDate: Date (expiration date)
│       ├── usageLimit: Number (total redemption capacity)
│       ├── userUsageLimit: Number (redemptions allowed per customer)
│       ├── usageCount: Number
│       ├── totalDiscountGiven: Number
│       ├── usedBy: Array<{ userId, orderId, discountAmount, usedAt }>
│       └── isActive: Boolean (indexed)
│
├── cart (Shopping Cart Database)
│   └── carts
│       ├── _id: ObjectId
│       ├── userId: ObjectId (optional, indexed)
│       ├── guestId: String (optional, indexed)
│       ├── items: Array<{ productId, title, price, image, category, companyId, quantity, stock }>
│       ├── totalItems: Number
│       └── subtotal: Number
│
└── orders (Order Management Database)
    └── orders
        ├── _id: ObjectId
        ├── orderNumber: String (unique, e.g. ORD-M8Z9-4321)
        ├── user: ObjectId (customer reference)
        ├── orderItems: Array<{ productId, title, image, price, quantity, companyId, category }>
        ├── shippingAddress: Object (fullName, phone, street, city, state, postalCode, country)
        ├── pricing: Object ({ itemsPrice, shippingPrice, taxPrice, discountAmount, couponCode, totalPrice })
        ├── paymentInfo: Object ({ method, status: 'pending'|'paid'|'failed', transactionId, paidAt })
        ├── orderStatus: String (enum: ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'])
        ├── statusHistory: Array<{ status, timestamp, note, updatedBy }>
        ├── fulfillment: Object ({ carrier, trackingNumber, estimatedDelivery, shippingNotes })
        └── cancellation: Object ({ isCancelled, reason, requestedAt, refundStatus })
```

---

## API Specification

All endpoints are accessed via the API Gateway base path: `http://localhost:5000/api`

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required | Rate Limited |
| ------ | -------- | ----------- | ------------- | ------------ |
| `GET` | `/health` | Gateway & Service status | No | No |
| `POST` | `/auth/register` | Register customer or merchant account | No | Yes (10/15m) |
| `POST` | `/auth/login` | Authenticate with email & password | No | Yes (10/15m) |
| `POST` | `/auth/google` | Authenticate with Google ID token | No | Yes (10/15m) |
| `POST` | `/auth/logout` | Clear HTTP-only session cookie | No | No |
| `GET` | `/auth/me` | Fetch authenticated user profile | Yes | No |
| `PUT` | `/auth/profile` | Update profile details | Yes | No |
| `PUT` | `/auth/business-details` | Update merchant banking & address | Company/Admin | No |
| `POST` | `/auth/addresses` | Add new saved shipping address | Yes | No |
| `DELETE` | `/auth/addresses/:id` | Remove saved shipping address | Yes | No |
| `PATCH` | `/auth/addresses/:id/default`| Set default shipping address | Yes | No |

### 2. Product Catalog & Specifications (`/api/products`)
| Method | Endpoint | Description | Auth Required |
| ------ | -------- | ----------- | ------------- |
| `GET` | `/products` | Search & filter products (category, price, sort) | No |
| `GET` | `/products/:id` | Get product details & specifications | No |
| `POST` | `/products` | Create merchant product with gallery & specs | Company/Admin |
| `PUT` | `/products/:id` | Update merchant product | Company/Admin |
| `DELETE` | `/products/:id` | Remove merchant product | Company/Admin |
| `GET` | `/products/company/mine` | List products owned by authenticated merchant | Company/Admin |
| `GET` | `/products/storefront/:id`| Public company storefront profile & products | No |

### 3. Customer Reviews & Merchant Replies (`/api/reviews`)
| Method | Endpoint | Description | Auth Required |
| ------ | -------- | ----------- | ------------- |
| `GET` | `/reviews/product/:id` | Get reviews, rating breakdown & distribution | Optional |
| `GET` | `/reviews/product/:id/my-review` | Get authenticated user's review for product | Yes |
| `GET` | `/reviews/my-reviews/product-ids` | List all product IDs reviewed by user | Yes |
| `POST` | `/reviews/product/:id` | Submit verified customer review with photos | Customer |
| `PUT` | `/reviews/:id` | Edit submitted customer review | Author/Admin |
| `DELETE` | `/reviews/:id` | Delete customer review | Author/Admin |
| `POST` | `/reviews/:id/helpful` | Upvote/downvote review helpfulness | Yes |
| `POST` | `/reviews/:id/reply` | Publish official merchant response | Company/Admin |
| `DELETE` | `/reviews/:id/reply` | Remove official merchant response | Company/Admin |
| `GET` | `/reviews/company/mine` | Merchant reviews management feed & metrics | Company/Admin |
| `POST` | `/reviews/upload-photo` | Upload customer review photo to Cloudinary | Yes |

### 4. Promotional Coupons & Discounts (`/api/coupons`)
| Method | Endpoint | Description | Auth Required |
| ------ | -------- | ----------- | ------------- |
| `GET` | `/coupons/available` | Get active available coupons for cart/store | Optional |
| `POST` | `/coupons/validate` | Validate promo code against cart items & calculate discount | Optional |
| `POST` | `/coupons` | Create new store or platform coupon campaign | Company/Admin |
| `GET` | `/coupons/company/mine` | Merchant coupon dashboard & redemption metrics | Company/Admin |
| `PUT` | `/coupons/:id` | Edit coupon parameters | Company/Admin |
| `PATCH` | `/coupons/:id/toggle` | Toggle active/paused coupon status | Company/Admin |
| `DELETE` | `/coupons/:id` | Delete coupon campaign | Company/Admin |
| `POST` | `/coupons/redeem` | Internal order redemption hook | Internal |

### 5. Shopping Cart (`/api/cart`)
| Method | Endpoint | Description | Auth Required |
| ------ | -------- | ----------- | ------------- |
| `GET` | `/cart` | Get active shopping cart | Optional |
| `POST` | `/cart/items` | Add item or increment quantity | Optional |
| `PUT` | `/cart/items/:id` | Update item quantity | Optional |
| `DELETE` | `/cart/items/:id` | Remove item from cart | Optional |
| `DELETE` | `/cart` | Clear entire shopping cart | Optional |

### 6. Order Management & Tracking (`/api/orders`)
| Method | Endpoint | Description | Auth Required |
| ------ | -------- | ----------- | ------------- |
| `POST` | `/orders` | Place new order with dynamic coupon discount | Yes |
| `GET` | `/orders/mine` | Get customer order history with review status | Yes |
| `GET` | `/orders/:id` | Get order tracking & fulfillment timeline | Yes |
| `POST` | `/orders/:id/cancel` | Cancel order with structured reason & refund | Yes |
| `GET` | `/orders/company/mine` | Merchant fulfillment studio & order feed | Company/Admin |
| `PUT` | `/orders/:id/status` | Update dispatch status & carrier tracking | Company/Admin |

---

## Local Development & Setup

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB Atlas** cluster URI
* **Upstash Redis** (or local Redis) URI
* **Cloudinary** account credentials

### 1. Installation

```bash
# Install Gateway dependencies
cd gateway && npm install && cd ..

# Install shared Microservices dependencies
cd services && npm install && cd ..

# Install Frontend dependencies
cd client && npm install && cd ..
```

### 2. Environment Configuration

```bash
cp gateway/.env.example gateway/.env
cp services/auth-service/.env.example services/auth-service/.env
cp services/product-service/.env.example services/product-service/.env
cp services/cart-service/.env.example services/cart-service/.env
cp services/order-service/.env.example services/order-service/.env
cp client/.env.example client/.env
```

### 3. Running Microservices Locally

Start each service in a dedicated terminal window:

```bash
# Terminal 1: Auth Microservice (Port 5001)
npm run auth-service

# Terminal 2: Unified Product, Review & Coupon Microservice (Port 5002)
npm run product-service

# Terminal 3: Cart Microservice (Port 5003)
npm run cart-service

# Terminal 4: Order Management Microservice (Port 5004)
npm run order-service

# Terminal 5: API Gateway (Port 5000)
npm run gateway

# Terminal 6: React Frontend (Port 5173)
npm run client
```

Navigate to `http://localhost:5173` to access the application.

---

## Verification & Build Validation

```bash
# Verify frontend TypeScript types and Vite bundle
npm run build:client

# Verify backend syntax
node -c services/product-service/server.js gateway/server.js services/order-service/server.js services/cart-service/server.js services/auth-service/server.js
```