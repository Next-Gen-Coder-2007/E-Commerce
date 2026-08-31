# MERN E-Commerce Platform

A modular, microservices-oriented e-commerce backend and frontend architecture featuring an API Gateway, an isolated Authentication Microservice with Redis rate limiting, MongoDB Atlas persistence, and a React TypeScript client with secure HTTP-only cookie session management.

## Overview

This project is an e-commerce platform designed from the ground up to follow an incremental microservices architecture. Rather than building a tightly coupled monolithic application, core domain responsibilities are decoupled into dedicated services communicating behind a single API Gateway.

The initial development stage establishes the platform foundation:
* An API Gateway providing unified routing, CORS configuration, security headers, and reverse proxying.
* A dedicated Authentication Service handling user identity, credential validation, Google OAuth, password hashing, JWT lifecycle, and Redis rate limiting.
* A single-page React frontend with client-side routing, responsive UI, session restoration, and route guards.

Future e-commerce domains (catalog, cart, orders, payments, notifications) are designed to integrate as independent microservices behind the Gateway without requiring architectural rewrites.

## Current Architecture

The platform uses a decoupled client-gateway-service pattern where the frontend only interfaces directly with the API Gateway.

```mermaid
flowchart TD
    Client["React Frontend (Port 5173)\nTypeScript + Vite + Tailwind CSS"]
    
    subgraph GatewayLayer["API Gateway Layer (Port 5000)"]
        Gateway["Express API Gateway\nReverse Proxy + CORS + Cookies + Load Balancing"]
    end

    subgraph ServiceLayer["Service Layer"]
        AuthService["Auth Service (Port 5001)\nExpress + Mongoose + JWT"]
        ProductService["Product Service (Port 5002)\nExpress + Mongoose + Multer"]
        CartService["Cart Service (Port 5003)\nExpress + Mongoose + Redis"]
    end

    subgraph DataLayer["Persistence & Caching (Same Cluster, Isolated Databases)"]
        AuthDB[("MongoDB: auth\nStores Users & RBAC")]
        ProductDB[("MongoDB: products\nStores Product Catalog & Stock")]
        CartDB[("MongoDB: cart\nStores Shopping Carts & Sessions")]
        Redis[("Upstash Redis (TLS)\nRate Limiting & Cart Cache")]
    end

    Client -- "HTTP /api/*\n(Credentials: include)" --> Gateway
    Gateway -- "Reverse Proxy /api/auth" --> AuthService
    Gateway -- "Reverse Proxy /api/products" --> ProductService
    Gateway -- "Reverse Proxy /api/cart" --> CartService
    AuthService --> AuthDB
    AuthService -.-> Redis
    ProductService --> ProductDB
    CartService --> CartDB
    CartService -.-> Redis
```

## Technology Stack

### Frontend
* React (v19)
* TypeScript
* Vite
* Tailwind CSS (v4)
* Axios
* Lucide React
* @react-oauth/google

### Backend
* Node.js (ES Modules)
* Express
* http-proxy-middleware
* Helmet
* Morgan
* Cookie-Parser
* CORS
* Dotenv

### Data & Infrastructure
* MongoDB Atlas (Mongoose ODM)
* Redis (ioredis)

### Authentication & Security
* JSON Web Tokens (jsonwebtoken)
* Secure HTTP-only cookies
* bcryptjs (Password hashing)
* Google OAuth 2.0 (google-auth-library)
* Atomic Redis Rate Limiter

## Project Structure

```text
E-Commerce/
├── client/                               # Frontend Single Page Application
│   ├── src/
│   │   ├── components/                   # Reusable UI components & route guards
│   │   │   ├── CartDrawer.tsx            # Slide-over interactive shopping cart drawer
│   │   │   ├── GoogleAuthButton.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Navbar.tsx                # Global navigation & live cart item badge
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── PublicOnlyRoute.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx           # Authentication state & session restore
│   │   │   └── CartContext.tsx           # Cart state, actions, & guest cart merging
│   │   ├── pages/
│   │   │   ├── business/
│   │   │   │   ├── BusinessHomePage.tsx     # Merchant workspace & business hub (/business)
│   │   │   │   ├── BusinessLoginPage.tsx    # Merchant authentication (/business/login)
│   │   │   │   └── BusinessRegisterPage.tsx # Merchant registration (/business/register)
│   │   │   ├── HomePage.tsx                 # Retail home & consumer catalog (/)
│   │   │   ├── LoginPage.tsx                # Customer sign-in (/login)
│   │   │   └── RegisterPage.tsx             # Customer registration (/register)
│   │   ├── services/
│   │   │   ├── api.ts                    # Axios instance pointing to Gateway
│   │   │   ├── authService.ts            # Auth API client functions
│   │   │   ├── cartService.ts            # Cart API client functions & guest ID tracking
│   │   │   └── productService.ts         # Product API client functions
│   │   ├── types/
│   │   │   ├── auth.ts                   # Auth interfaces and types
│   │   │   ├── cart.ts                   # Cart and CartItem TypeScript definitions
│   │   │   └── product.ts                # Product TypeScript definitions
│   │   ├── App.tsx                       # Router configuration & CartProvider
│   │   ├── index.css                     # Tailwind CSS entry
│   │   └── main.tsx                      # Application bootstrap
│   ├── .env / .env.example
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── gateway/                              # Modular API Gateway
│   ├── config/
│   │   ├── redis.js                      # Redis client for gateway rate limiting
│   │   └── services.js                   # Microservices registry & instance clusters
│   ├── middleware/
│   │   ├── authGateway.js                # Token checking & user header injection
│   │   ├── loadBalancer.js               # Multi-instance round-robin load balancer
│   │   ├── rateLimiter.js                # Gateway-level rate limiter (global + auth)
│   │   ├── logging.js                    # Correlation ID tracking (x-correlation-id)
│   │   └── errorMiddleware.js            # Gateway-level 404 & error handlers
│   ├── routes/
│   │   ├── proxyHandler.js               # Dynamic reverse proxy middleware
│   │   └── index.js                      # Routing registry & health endpoints
│   ├── .env / .env.example
│   ├── package.json
│   └── server.js                         # Gateway orchestration entry point
├── services/                             # Shared Microservices Root
│   ├── auth-service/                     # Authentication Microservice (Port 5001)
│   │   ├── config/
│   │   │   ├── db.js                     # MongoDB connection manager
│   │   │   └── redis.js                  # Redis client with fallback handling
│   │   ├── controllers/
│   │   │   └── authController.js         # Register, login, google, logout, /me
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js         # JWT cookie validation middleware
│   │   │   ├── errorMiddleware.js        # Global error & 404 handlers
│   │   │   └── rateLimiter.js            # Redis atomic counter rate limiter
│   │   ├── models/
│   │   │   └── User.js                   # Mongoose User schema & password hooks
│   │   ├── routes/
│   │   │   └── authRoutes.js             # Route declarations with rate limiter
│   │   ├── utils/
│   │   │   └── jwt.js                    # JWT signing & cookie helpers
│   │   ├── .env / .env.example
│   │   ├── package.json
│   │   └── server.js                     # Auth Service entry point
│   ├── product-service/                  # Product Catalog & Inventory Microservice (Port 5002)
│   │   ├── config/
│   │   │   ├── db.js                     # MongoDB connection manager
│   │   │   └── cloudinary.js             # Cloudinary asset storage config
│   │   ├── controllers/
│   │   │   └── productController.js      # Catalog search, filter, company CRUD, image upload
│   │   ├── middleware/
│   │   │   └── authCheck.js              # Gateway context header verification
│   │   ├── models/
│   │   │   └── Product.js                # Product schema (stock, category, companyId)
│   │   ├── routes/
│   │   │   └── productRoutes.js          # Catalog & merchant CRUD routes
│   │   ├── .env / .env.example
│   │   ├── package.json
│   │   └── server.js                     # Product Service entry point
│   ├── cart-service/                     # Shopping Cart Microservice (Port 5003)
│   │   ├── config/
│   │   │   ├── db.js                     # MongoDB connection manager
│   │   │   └── redis.js                  # Redis client for cart caching
│   │   ├── controllers/
│   │   │   └── cartController.js         # Cart CRUD, item steppers, guest merging
│   │   ├── middleware/
│   │   │   ├── authCheck.js              # Identity & guest session extractor
│   │   │   └── errorMiddleware.js        # Global error & 404 handlers
│   │   ├── models/
│   │   │   └── Cart.js                   # Cart schema & automatic subtotal calculation
│   │   ├── routes/
│   │   │   └── cartRoutes.js             # Cart endpoints (/api/cart/*)
│   │   ├── .env / .env.example
│   │   ├── package.json
│   │   └── server.js                     # Cart Service entry point
│   └── package.json                      # Shared microservices dependencies
├── package.json                          # Root repository orchestration scripts
└── README.md
```

## Authentication

The authentication system is self-contained within the Auth Service and exposes endpoints through the Gateway:

* **User Registration**: Supports both **Customer** (buyer) and **Company** (seller / merchant) account types. Validates contact person name, company name (for company accounts), email format, password complexity (minimum 6 characters), and password matching. Hashes passwords using bcrypt with salt factor 10. Direct registration of the `admin` role is restricted.
* **Email/Password Login**: Compares credentials against bcrypt hashes and issues a signed JWT stored inside a secure HTTP-only cookie.
* **Google OAuth 2.0**: Validates Google ID tokens on the backend using `google-auth-library`, finding existing accounts by verified email or provisioning new user profiles (defaulting to customer role).
* **Session Restoration (`/api/auth/me`)**: Restores user identity on client load by extracting and verifying the JWT from incoming HTTP-only cookies.
* **Protected Routes & RBAC**: Express middleware (`protect` and `authorize`) verifies token validity and enforces Role-Based Access Control (`customer`, `company`, `admin`).
* **Logout**: Clears the authentication cookie with an immediate expiration header.
* **Rate Limiting**: Protects sensitive endpoints (`/register`, `/login`, `/google`) with Redis atomic counters (10 requests per 15-minute sliding window) and returns standard `429 Too Many Requests` responses with `Retry-After` headers.

### Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Client as React Client (5173)
    participant Gateway as API Gateway (5000)
    participant Auth as Auth Service (5001)
    participant Redis as Redis
    participant DB as MongoDB Atlas

    Note over User,DB: Registration / Login Flow
    User->>Client: Submit Credentials & Role (Customer / Company)
    Client->>Gateway: POST /api/auth/login or /api/auth/register
    Gateway->>Auth: Proxy Request
    Auth->>Redis: Check Rate Limit (INCR / EXPIRE)
    Redis-->>Auth: Rate Limit OK (Count <= 10)
    Auth->>DB: Query User & Verify bcrypt hash
    DB-->>Auth: User Record
    Auth->>Auth: Sign JWT (7-day expiry)
    Auth-->>Gateway: 200 OK + Set-Cookie (jwt, HttpOnly, SameSite=Lax)
    Gateway-->>Client: 200 OK + Forward Set-Cookie
    Client-->>User: Update AuthContext & Navigate to Dashboard

    Note over User,DB: Session Restoration Flow
    Client->>Gateway: GET /api/auth/me (Cookie: jwt=...)
    Gateway->>Auth: Proxy Request with Cookie
    Auth->>Auth: Verify JWT Secret
    Auth->>DB: Fetch User (exclude password)
    DB-->>Auth: User Profile
    Auth-->>Gateway: 200 OK { success: true, user }
    Gateway-->>Client: 200 OK { success: true, user }
    Client-->>User: Hydrate State without page flicker
```

## Microservices Architecture

The architecture enforces strict decoupling between services:

* **Modular API Gateway**:
  * **Auth Token Inspection & RBAC**: Verifies incoming HTTP-only JWT cookies or bearer headers, injects authenticated user headers (`x-user-id`, `x-user-role`, `x-user-email`, `x-user-company`) for downstream services, and blocks unauthorized requests before reaching services.
  * **Dynamic Multi-Instance Load Balancing**: Round-robin load balancer distributing traffic across one or more configured microservice instances.
  * **Distributed Rate Limiting**: Multi-tiered rate limiters backed by Redis atomic counters protecting both global traffic (300 req/min) and sensitive authentication endpoints (30 req/15min).
  * **Correlation ID Tracing**: Injects unique `x-correlation-id` headers for distributed request tracing across microservices.
  * **Security & Reverse Proxy**: Enforces Helmet security headers, credentialed CORS policies, and reverse proxy routing.
* **Auth Service**: Holds exclusive ownership of user accounts, credential storage, password hashing algorithms, and token generation.
* **Data Ownership**: MongoDB access for user profiles is strictly isolated within the Auth Service.
* **Incremental Evolution**: Future services (`product-service`, `cart-service`, `order-service`, `payment-service`, `notification-service`) will be provisioned as independent services and registered with the Gateway.

## Database Architecture (Database-per-Service Pattern)

The platform implements the **Database-per-Service** microservices pattern using a single MongoDB Atlas cluster partitioned into isolated logical databases for strict data encapsulation. No service has direct read or write access to another service's database.

```text
MongoDB Atlas Cluster (cluster0.1pknqka.mongodb.net)
├── auth (Auth Microservice Database)
│   └── users
│       ├── _id: ObjectId
│       ├── name: String
│       ├── email: String (unique, indexed)
│       ├── password: String (bcrypt hash, optional if googleId present)
│       ├── googleId: String (sparse, indexed)
│       ├── avatar: String
│       ├── role: String (enum: ['customer', 'company', 'admin'], default: 'customer')
│       ├── companyName: String (optional, merchant entity name)
│       ├── createdAt: Date
│       └── updatedAt: Date
│
├── products (Product Catalog & Inventory Database)
│   └── products
│       ├── _id: ObjectId
│       ├── title: String (indexed for text search)
│       ├── description: String
│       ├── price: Number
│       ├── category: String (enum: electronics, fashion, home, beauty, etc.)
│       ├── image: String (Cloudinary CDN URL)
│       ├── stock: Number
│       ├── companyId: ObjectId (indexed, reference to merchant)
│       ├── companyName: String
│       ├── rating: Number (default: 4.8)
│       ├── numReviews: Number (default: 0)
│       ├── createdAt: Date
│       └── updatedAt: Date
│
└── cart (Shopping Cart Database)
    └── carts
        ├── _id: ObjectId
        ├── userId: ObjectId (optional, indexed)
        ├── guestId: String (optional, indexed)
        ├── items: Array
        │   ├── productId: ObjectId
        │   ├── title: String
        │   ├── price: Number
        │   ├── image: String
        │   ├── category: String
        │   ├── companyName: String
        │   ├── stock: Number
        │   └── quantity: Number
        ├── totalItems: Number
        ├── totalPrice: Number
        ├── createdAt: Date
        └── updatedAt: Date
```

### Microservice Isolation Rules
1. **Dedicated Database Connections**: Each service connects with its own connection string specifying its targeted database (`/auth`, `/products`, or `/cart`) or via the `MONGO_DB_NAME` environment variable.
2. **Zero Cross-Database Joins**: Cross-domain data communication occurs exclusively through the API Gateway via authenticated HTTP headers (`x-user-id`, `x-user-role`, `x-user-company`) or payload attributes.
3. **Independent Schema Evolution**: Any schema migration, indexing, or scaling applied to one domain (e.g. adding product inventory fields) has zero blast radius on user auth or cart storage.

## API Specification

All endpoints are accessed via the API Gateway base path: `http://localhost:5000/api`

| Method | Endpoint | Description | Auth Required | Rate Limited |
| ------ | -------- | ----------- | ------------- | ------------ |
| `GET` | `/health` | Gateway health check and service registry status | No | No |
| `GET` | `/auth/health` | Auth Service health and Redis connection status | No | No |
| `POST` | `/auth/register` | Register a new account with email and password | No | Yes (10/15m) |
| `POST` | `/auth/login` | Authenticate using email and password | No | Yes (10/15m) |
| `POST` | `/auth/google` | Authenticate or register using Google OAuth ID token | No | Yes (10/15m) |
| `POST` | `/auth/logout` | Invalidate session and clear HTTP-only cookie | No | No |
| `GET` | `/auth/me` | Retrieve authenticated user profile from JWT cookie | Yes | No |
| `GET` | `/products` | Query product catalog with search, category & sort | No | No |
| `GET` | `/products/:id` | Get dedicated product details by ID | No | No |
| `POST` | `/products` | Create merchant product with Cloudinary image | Company/Admin | No |
| `PUT` | `/products/:id` | Update owned merchant product listing | Company/Admin | No |
| `DELETE` | `/products/:id` | Delete owned merchant product listing | Company/Admin | No |
| `GET` | `/cart` | Get active cart items (guest or authenticated) | Optional | No |
| `POST` | `/cart/items` | Add or increment item in shopping cart | Optional | No |
| `PUT` | `/cart/items/:id` | Update shopping cart item quantity | Optional | No |
| `DELETE` | `/cart/items/:id` | Remove specific item from cart | Optional | No |
| `DELETE` | `/cart` | Clear entire shopping cart | Optional | No |

## Environment Variables

Configuration files use `.env` files per application. Template files (`.env.example`) are provided in each component directory.

### API Gateway (`gateway/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
AUTH_SERVICE_URL=http://localhost:5001
PRODUCT_SERVICE_URL=http://localhost:5002
CART_SERVICE_URL=http://localhost:5003
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
```

### Auth Service (`services/auth-service/.env`)
```env
PORT=5001
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/auth?retryWrites=true&w=majority
MONGO_DB_NAME=auth
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
JWT_SECRET=ecommerce_super_secret_jwt_key_2026_change_in_production
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GATEWAY_URL=http://localhost:5000
```

### Product Service (`services/product-service/.env`)
```env
PORT=5002
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/products?retryWrites=true&w=majority
MONGO_DB_NAME=products
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GATEWAY_URL=http://localhost:5000
```

### Cart Service (`services/cart-service/.env`)
```env
PORT=5003
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/cart?retryWrites=true&w=majority
MONGO_DB_NAME=cart
REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT.upstash.io:6379
GATEWAY_URL=http://localhost:5000
```

### Frontend Client (`client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

## Local Development

### Prerequisites
* Node.js (v18.0.0 or higher)
* npm (v9.0.0 or higher)
* MongoDB Atlas connection string (or local MongoDB instance)
* Upstash Redis connection string (or local Redis instance)

### 1. Installation

Install dependencies across all components:

```bash
# Install Gateway dependencies
cd gateway && npm install && cd ..

# Install shared Microservices dependencies
cd services && npm install && cd ..

# Install Client dependencies
cd client && npm install && cd ..
```

### 2. Environment Configuration

Copy the example environment files and configure your credentials:

```bash
cp gateway/.env.example gateway/.env
cp services/auth-service/.env.example services/auth-service/.env
cp services/product-service/.env.example services/product-service/.env
cp services/cart-service/.env.example services/cart-service/.env
cp client/.env.example client/.env
```

Each microservice connects to its own dedicated database within the same MongoDB Atlas cluster:
- **Auth Service**: `auth`
- **Product Service**: `products`
- **Cart Service**: `cart`

### 3. Starting the Services

Start each service in separate terminal sessions, or run the following root scripts:

```bash
# Terminal 1: Start Auth Microservice (Port 5001)
npm run auth-service

# Terminal 2: Start Product Microservice (Port 5002)
npm run product-service

# Terminal 3: Start Shopping Cart Microservice (Port 5003)
npm run cart-service

# Terminal 4: Start API Gateway (Port 5000)
npm run gateway

# Terminal 5: Start React Client (Port 5173)
npm run client
```

Open `http://localhost:5173` in your browser to access the application.

## Security Practices

* **HTTP-Only Cookies**: JWT tokens are transmitted exclusively inside `HttpOnly`, `SameSite=Lax` cookies, preventing client-side JavaScript access and mitigating cross-site scripting (XSS) token theft.
* **Password Hashing**: Passwords are never stored in plaintext. They are salted and hashed using `bcryptjs` with 10 salt rounds before database writes.
* **Brute-Force Protection**: Sensitive authentication endpoints enforce rate limiting via Redis atomic counters with automatic `429 Too Many Requests` status codes.
* **Sanitized Responses**: Mongoose schema serialization hooks automatically delete the `password` hash and internal `__v` metadata before returning user JSON objects.
* **Strict CORS Policies**: The API Gateway allows credentialed requests strictly from the configured `CLIENT_URL`.
* **Security Headers**: The API Gateway incorporates Helmet middleware for header protection.
* **Decoupled Internal Network**: Services run on internal ports (5001, 5002, 5003) and are accessed exclusively through the API Gateway (Port 5000).

## Development Roadmap

```mermaid
flowchart LR
    Auth["1. Auth Service\n(Completed)"] --> Product["2. Product Service\n(Completed)"]
    Product --> Cart["3. Cart Service\n(Completed)"]
    Cart --> Order["4. Order Service\n(Planned)"]
    Order --> Payment["5. Payment Service\n(Planned)"]
    Payment --> Notification["6. Notification Service\n(Planned)"]
```

* **Phase 1 (Completed)**: API Gateway, Auth Service, MongoDB Atlas, Redis rate limiting, React client with full authentication lifecycle.
* **Phase 2 (Completed)**: Product Catalog & Merchant Inventory Service with search, category filtering, stock tracking, and Cloudinary media uploads.
* **Phase 3 (Completed)**: Shopping Cart Microservice with dual guest/user sessions, automatic cart merging, Redis caching, and interactive React Cart Drawer.
* **Phase 4 (Planned)**: Order Management Service with order lifecycles and address management.
* **Phase 5 (Planned)**: Payment Gateway Service supporting Stripe/PayPal webhooks and transaction records.
* **Phase 6 (Planned)**: Asynchronous Notification Service for transactional emails and event-driven updates.

## Architecture Principles

* **Single Responsibility**: Each microservice encapsulates one bounded business context.
* **Private Datastores**: No service reads or writes directly to another service's database tables or collections.
* **Gateway Facade**: Clients communicate with one public gateway URL; downstream service topology is hidden from the client.
* **Stateless Application Tier**: Services do not hold state in local memory; sessions are verified via stateless JWTs.
* **Independent Scalability**: Services can be scaled or containerized independently based on traffic demands.
* **Graceful Degradation**: Infrastructure dependencies such as Redis include localized fallbacks for resilient development.

## Verification & Build Validation

To validate frontend TypeScript compilation and bundling:

```bash
# Run TypeScript compilation and build validation for frontend
npm run build:client
```

## Contributing

1. Create a feature branch (`git checkout -b feature/domain-name`).
2. Adhere to code conventions and verify client builds cleanly (`npm run build:client`).
3. Maintain TypeScript types and interface definitions.
4. Submit a Pull Request with technical rationale and verification details.

## License

This project currently has no specified open-source license. All rights are reserved.