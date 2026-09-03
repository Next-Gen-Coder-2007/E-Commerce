# NovaCommerce Enterprise Distributed Marketplace: System Architecture & Technical Specifications

> **System Status**: Production-Ready / Enterprise Distributed Topology  
> **All 12 Phases**: 100% Completed  
> **Repository**: [Next-Gen-Coder-2007/E-Commerce](https://github.com/Next-Gen-Coder-2007/E-Commerce)

---

## 1. Executive System Overview

NovaCommerce is an enterprise distributed multi-vendor e-commerce platform engineered with Node.js microservices, Apache Kafka (KRaft mode) event streaming, Redis distributed caching, MongoDB Database-per-Service isolation, OpenTelemetry distributed tracing, Prometheus & Grafana telemetry, Docker & Kubernetes cloud-native orchestration, and an AI-powered semantic search & shopping intelligence platform, fronted by a modern React 19 TypeScript single-page application.

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Application Layer (Port 5173)"]
        Client["React 19 + TypeScript + Vite + Tailwind CSS\n(Storefront, Admin, Merchant Portal, AI Assistant)"]
    end

    subgraph GatewayLayer["API Gateway Layer (Port 5000)"]
        Gateway["Express API Gateway\n• Reverse Proxy & Load Balancer\n• W3C TraceContext Propagation\n• Redis Sliding-Window Rate Limiting\n• Swagger / OpenAPI Docs (/docs)\n• Prometheus Metrics Exporter (/metrics)"]
    end

    subgraph MicroservicesLayer["Distributed Microservices Layer"]
        AuthSvc["Auth Service\n(:5001)"]
        ProductSvc["Product & AI Service\n(:5002)"]
        CartSvc["Cart Service\n(:5003)"]
        OrderSvc["Order & Saga Service\n(:5004)"]
        PaymentSvc["Payment Service\n(:5005)"]
        WishlistSvc["Wishlist Service\n(:5006)"]
        InvSvc["Inventory Service\n(:5007)"]
        NotifWorker["Notification Worker\n(Async Consumer)"]
    end

    subgraph StorageLayer["Data Layer (Database-per-Service Isolation)"]
        AuthDB[("MongoDB: ecommerce-auth")]
        ProductDB[("MongoDB: ecommerce-product")]
        CartDB[("MongoDB: ecommerce-cart")]
        OrderDB[("MongoDB: ecommerce-order")]
        PaymentDB[("MongoDB: ecommerce-payment")]
        WishlistDB[("MongoDB: ecommerce-wishlist")]
        InvDB[("MongoDB: ecommerce-inventory")]
        RedisStore[("Upstash / Local Redis 7.2\n• Rate Limits\n• Idempotency\n• Cart Sessions")]
    end

    subgraph EventLayer["Event Backbone & Reliability"]
        KafkaBrokers{{"Apache Kafka (KRaft Mode :9092)\nTopics: order.events, payment.events,\ninventory.events, wishlist.events, notification.events"}}
        OutboxWorker["Transactional Outbox CDC Publisher"]
    end

    subgraph ObservabilityLayer["Observability & Monitoring"]
        Prometheus["Prometheus (:9090)"]
        Grafana["Grafana (:3000)"]
        KafkaUI["Kafka UI (:8080)"]
    end

    Client -- "HTTP /api/* (Credentials: include)" --> Gateway
    Gateway --> AuthSvc
    Gateway --> ProductSvc
    Gateway --> CartSvc
    Gateway --> OrderSvc
    Gateway --> PaymentSvc
    Gateway --> WishlistSvc
    Gateway --> InvSvc

    AuthSvc --> AuthDB
    ProductSvc --> ProductDB
    CartSvc --> CartDB
    CartSvc --> RedisStore
    OrderSvc --> OrderDB
    PaymentSvc --> PaymentDB
    WishlistSvc --> WishlistDB
    InvSvc --> InvDB

    OrderSvc --> OutboxWorker
    OutboxWorker --> KafkaBrokers
    PaymentSvc --> KafkaBrokers
    WishlistSvc --> KafkaBrokers
    InvSvc --> KafkaBrokers

    KafkaBrokers --> NotifWorker
    KafkaBrokers --> InvSvc

    Gateway -.-> Prometheus
    OrderSvc -.-> Prometheus
    Prometheus -.-> Grafana
```

---

## 2. Microservices Domain Boundaries & Isolation Matrix

Every microservice operates within a strict bounded context with its own database, preventing any cross-database joins or schema coupling:

| Microservice | Port | Database | Primary Responsibilities | Key Dependencies |
| :--- | :---: | :--- | :--- | :--- |
| **API Gateway** | `5000` | — | Reverse proxy routing, W3C trace injection, rate limiting, Swagger UI, Prometheus scraping | Redis, Express, Helmet |
| **Auth Service** | `5001` | `ecommerce-auth` | User/Merchant identity, JWT auth cookies, Google OAuth, addresses, RBAC | Mongoose, JWT, bcryptjs |
| **Product Service** | `5002` | `ecommerce-product` | Canonical catalog, reviews, coupons, 64-dim vector embeddings, RRF hybrid search, AI assistant | Cloudinary, Multer, Vector Math |
| **Cart Service** | `5003` | `ecommerce-cart` | Real-time cart state, guest/user carts, quantity updates, Redis cache acceleration | Redis, Mongoose |
| **Order Service** | `5004` | `ecommerce-order` | Order lifecycle, Saga Orchestrator, Transactional Outbox, state machine, merchant orders | Outbox Publisher, Kafka, Circuit Breakers |
| **Payment Service** | `5005` | `ecommerce-payment` | Idempotent payment charges (`Idempotency-Key`), mock/Stripe processing, fraud scoring engine | Redis, Kafka, Idempotency Middleware |
| **Wishlist Service** | `5006` | `ecommerce-wishlist` | Wishlists, public share tokens, 1-click move-to-cart, price drop detection | Mongoose, Kafka Producer |
| **Inventory Service**| `5007` | `ecommerce-inventory`| Two-phase reservation (`reserve`, `commit`, `release`), warehouse stock tracking, audit logs | Mongoose, Kafka Consumer/Producer |
| **Notification Worker**| — | — | Background Kafka consumer for order confirmation, payment receipts, restocks, and price-drops | KafkaJS, Nodemailer/Loggers |

---

## 3. Distributed Transactions: Saga Orchestration & Outbox Pattern

### 3.1 Order Checkout Saga Sequence
To maintain consistency across isolated datastores without distributed locks, the `order-service` executes an orchestrated Saga:

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant Gateway as API Gateway (:5000)
    participant OrderSvc as Order Service (:5004)
    participant InvSvc as Inventory Service (:5007)
    participant PaymentSvc as Payment Service (:5005)
    participant Kafka as Apache Kafka (:9092)
    participant NotifWorker as Notification Worker

    Customer->>Gateway: POST /api/orders (Submit Checkout)
    Gateway->>OrderSvc: Forward with W3C traceparent
    OrderSvc->>OrderSvc: 1. Create Order (Status: PENDING_PAYMENT)
    
    OrderSvc->>InvSvc: 2. Reserve Stock (POST /api/inventory/reserve, TTL=15m)
    alt Inventory Sufficient
        InvSvc-->>OrderSvc: 200 OK (Reservation Token: res_89a2)
        
        OrderSvc->>PaymentSvc: 3. Charge Payment (POST /api/payments/charge with Idempotency-Key)
        alt Payment Succeeded
            PaymentSvc-->>OrderSvc: 200 OK (txn_948271)
            OrderSvc->>InvSvc: 4. Commit Stock (POST /api/inventory/commit)
            InvSvc-->>OrderSvc: Stock Permanently Deducted
            OrderSvc->>OrderSvc: 5. Transition Order -> CONFIRMED
            OrderSvc->>Kafka: 6. Outbox publishes order.created
            Kafka->>NotifWorker: 7. Consume & send Order Confirmation Email
            OrderSvc-->>Gateway: 201 Created { orderId: "ORD-9821", status: "confirmed" }
            Gateway-->>Customer: Order Confirmed
        else Payment Failed / Card Declined
            PaymentSvc-->>OrderSvc: 402 Payment Declined
            OrderSvc->>InvSvc: Compensate: Release Stock (POST /api/inventory/release)
            InvSvc-->>OrderSvc: Stock Released to Pool
            OrderSvc->>OrderSvc: Transition Order -> CANCELLED
            OrderSvc-->>Gateway: 400 Bad Request: Payment Failed
            Gateway-->>Customer: Payment Failed, Items Restored
        end
    else Inventory Insufficient
        InvSvc-->>OrderSvc: 409 Conflict (INSUFFICIENT_STOCK)
        OrderSvc->>OrderSvc: Transition Order -> CANCELLED
        OrderSvc-->>Gateway: 409 Item Out of Stock
        Gateway-->>Customer: Checkout Aborted
    end
```

### 3.2 Transactional Outbox Pattern
Guarantees zero lost events during database mutations without dual-write race hazards:
1. Within a local MongoDB database transaction, the service writes both the business entity (e.g. `Order`) and an `OutboxMessage` record (`status: UNPUBLISHED`).
2. A dedicated asynchronous background publisher polls unpublished outbox records and publishes them to Apache Kafka.
3. Upon receiving a broker ACK, the outbox record is marked `status: PUBLISHED`.

---

## 4. AI Intelligence, Search & Recommendation Engine

```mermaid
flowchart TD
    UserQuery["User Natural Language Query / Browsing Profile"] --> Router{"Engine Dispatcher"}

    subgraph VectorBranch["Dense Vector Semantic Branch"]
        Router --> DenseEncoder["64-Dimensional Float Dense Normalizer"]
        DenseEncoder --> VectorSim["Cosine Similarity Score (0.0 to 1.0)"]
    end

    subgraph LexicalBranch["Lexical BM25 Keyword Branch"]
        Router --> Tokenizer["N-Gram & Token Matcher"]
        Tokenizer --> BM25Score["Term Frequency & Inverse Doc Score"]
    end

    VectorSim --> RRF["Reciprocal Rank Fusion (RRF)\nScore = 1/(60 + Rank_Vector) + 1/(60 + Rank_BM25)"]
    BM25Score --> RRF

    subgraph BehavioralIntent["Multi-Signal Intent Engine"]
        Purchases["Completed Purchase (Weight: 5.0)"] --> IntentScorer["Intent Scorer"]
        CartAdd["Add to Cart (Weight: 4.5)"] --> IntentScorer
        WishlistAdd["Wishlist Item (Weight: 4.0 - High Aspirational)"] --> IntentScorer
        Views["Product View (Weight: 1.5)"] --> IntentScorer
    end

    RRF --> PersonalizationJoin["Personalized Re-Ranking"]
    IntentScorer --> PersonalizationJoin
    PersonalizationJoin --> FinalResults["Top Ranked Product Feed / 'For You' Carousel"]
```

### 4.1 Hybrid Search Mathematics (Reciprocal Rank Fusion)
Rank fusion blends conceptual vector relevance with exact term precision:
$$RRF(d) = \sum_{m \in \{\text{lexical}, \text{vector}\}} \frac{1}{k + r_m(d)} \quad (k = 60)$$

### 4.2 Conversational AI Shopping Concierge
- Endpoint: `POST /api/products/ai-assistant/chat`
- Features: Real-time price bound extraction, category categorization, conversational history memory, and structured interactive product response cards with direct 1-click cart addition.

### 4.3 Real-Time Multi-Factor Fraud Scoring
- Endpoint: `POST /api/payments/fraud/evaluate`
- Evaluates:
  - Velocity bursts (orders per hour / day)
  - Order value standard deviations
  - Geolocation mismatch (billing vs shipping country)
  - Card decline burst frequencies
- Decisions: `APPROVE` ($<40$), `REVIEW` ($40-75$), `REJECT` ($>75$).

---

## 5. Resilience Engineering & Observability

### 5.1 Stateful Circuit Breakers
Implemented in `services/shared/resilience/circuitBreaker.js`:
- **`CLOSED`**: Healthy operation, rolling window metrics tracking.
- **`OPEN`**: Tripped when error rate $>50\%$; fails fast ($<1\text{ms}$) with fallback response.
- **`HALF_OPEN`**: Cooldown elapsed (10s); allows probe requests before self-healing.

### 5.2 OpenTelemetry & Prometheus Telemetry
- **Trace Context**: W3C `traceparent` headers injected at API Gateway and forwarded across synchronous HTTP calls and asynchronous Kafka message headers.
- **Metrics**: Standard `/metrics` scrapers exported for Prometheus, powering Grafana dashboards for latency heatmaps (p50, p90, p95, p99), error rates, and checkout throughput.

---

## 6. Comprehensive API Reference

All requests route through the API Gateway at `http://localhost:5000`:

| Module | Method | Path | Description | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| **System** | `GET` | `/health` | Gateway & Service cluster health | No |
| **System** | `GET` | `/metrics` | Prometheus metrics scrape endpoint | No |
| **System** | `GET` | `/docs` | Interactive Swagger UI API documentation | No |
| **System** | `GET` | `/openapi.json` | OpenAPI 3.0.3 specification | No |
| **Auth** | `POST` | `/api/auth/register` | Register customer or merchant | No (Rate Limited) |
| **Auth** | `POST` | `/api/auth/login` | Authenticate & issue JWT cookie | No (Rate Limited) |
| **Auth** | `POST` | `/api/auth/google` | Google OAuth single sign-on | No (Rate Limited) |
| **Auth** | `POST` | `/api/auth/logout` | Revoke session & clear cookie | No |
| **Auth** | `GET` | `/api/auth/me` | Get current user profile | Yes |
| **Auth** | `PUT` | `/api/auth/business-details`| Update merchant banking & tax ID | Merchant / Admin |
| **Products** | `GET` | `/api/products` | Paginated product search & filters | No |
| **Products** | `GET` | `/api/products/:id` | Full product details & specifications | No |
| **Products** | `POST` | `/api/products` | Create merchant product | Merchant / Admin |
| **Products** | `GET` | `/api/products/search/semantic`| Hybrid vector + RRF semantic search | No |
| **Products** | `GET` | `/api/products/recommendations/for-you`| Personalized recommendations | Optional |
| **Products** | `GET` | `/api/products/recommendations/frequently-bought-together/:id`| Bundle recommendations | No |
| **Products** | `POST` | `/api/products/ai-assistant/chat`| Conversational shopping concierge | No |
| **Reviews** | `GET` | `/api/reviews/product/:id` | Product reviews & rating breakdowns | No |
| **Reviews** | `POST` | `/api/reviews/product/:id` | Submit verified customer review | Customer |
| **Coupons** | `GET` | `/api/coupons/available` | Active eligible discount coupons | Optional |
| **Coupons** | `POST` | `/api/coupons/validate` | Validate coupon against cart | Optional |
| **Cart** | `GET` | `/api/cart` | Get user or guest shopping cart | Optional |
| **Cart** | `POST` | `/api/cart/items` | Add item or increment quantity | Optional |
| **Cart** | `PUT` | `/api/cart/items/:id` | Update item quantity in cart | Optional |
| **Cart** | `DELETE`| `/api/cart/items/:id` | Remove item from cart | Optional |
| **Wishlist** | `GET` | `/api/wishlist` | Fetch customer wishlist & price status | Yes |
| **Wishlist** | `POST` | `/api/wishlist/items` | Add product to wishlist | Yes |
| **Wishlist** | `POST` | `/api/wishlist/items/:id/move-to-cart`| Move wishlist item into cart | Yes |
| **Wishlist** | `GET` | `/api/wishlist/shared/:token`| Public shared gift registry | No |
| **Wishlist** | `PATCH`| `/api/wishlist/privacy` | Toggle public/private wishlist | Yes |
| **Orders** | `POST` | `/api/orders` | Submit checkout (Triggers Saga) | Yes |
| **Orders** | `GET` | `/api/orders/mine` | Customer order history | Yes |
| **Orders** | `GET` | `/api/orders/:id` | Order tracking & status timeline | Yes |
| **Orders** | `POST` | `/api/orders/:id/cancel`| Cancel order with structured refund | Yes |
| **Payments** | `POST` | `/api/payments/charge` | Idempotent payment processing | Yes (`Idempotency-Key`) |
| **Payments** | `POST` | `/api/payments/refund` | Payment refund hook | Yes |
| **Payments** | `POST` | `/api/payments/fraud/evaluate`| Real-time 0-100 risk scoring | Internal / Auth |
| **Inventory**| `POST` | `/api/inventory/reserve` | 2-phase stock reservation (TTL: 15m)| Internal / Auth |
| **Inventory**| `POST` | `/api/inventory/commit` | Permanently commit stock deduction | Internal / Auth |
| **Inventory**| `POST` | `/api/inventory/release` | Release reserved stock back to pool | Internal / Auth |
| **Inventory**| `GET` | `/api/inventory/product/:id`| Real-time warehouse stock query | No |

---

## 7. Cloud Native & Deployment Architecture

### 7.1 Docker Compose Local Cluster
```bash
# Start Kafka KRaft cluster
npm run kafka:up

# Initialize Kafka topics
npm run kafka:init

# Start all microservices, API Gateway, and React frontend
npm run gateway
npm run auth-service
npm run product-service
npm run cart-service
npm run order-service
npm run payment-service
npm run wishlist-service
npm run inventory-service
npm run notification-service
npm run client
```

### 7.2 Kubernetes Manifests (`k8s/`)
- `00-namespace.yaml`: Isolated `novacommerce` production namespace.
- `01-configmap.yaml` & `02-secrets.yaml`: Centralized environment configurations.
- `03-ingress.yaml`: NGINX Ingress controller with TLS termination and path routing.
- `04-hpa.yaml`: Horizontal Pod Autoscalers targeting $70\%$ CPU utilization.
- `deployments/` & `services/`: Declarative deployments with rolling updates and readiness/liveness health probes.
