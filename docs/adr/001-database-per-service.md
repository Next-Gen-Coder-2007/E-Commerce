# ADR 001: Database-per-Service Architecture Pattern

## Status
**Accepted** (Implemented across all 8 microservices)

## Context
In a large multi-vendor marketplace, sharing a single monolithic relational or document database across disparate business capabilities leads to tight schema coupling, blast radius propagation, bottlenecked database scaling, and deployment gridlocks.

## Decision
We adopted the **Database-per-Service** architectural pattern. Each bounded context microservice owns and encapsulates its private datastore:
- `auth-service` -> `ecommerce-auth` (MongoDB)
- `product-service` -> `ecommerce-product` (MongoDB)
- `cart-service` -> `ecommerce-cart` (MongoDB / Redis)
- `order-service` -> `ecommerce-order` (MongoDB)
- `payment-service` -> `ecommerce-payment` (MongoDB)
- `wishlist-service` -> `ecommerce-wishlist` (MongoDB)
- `inventory-service` -> `ecommerce-inventory` (MongoDB)

## Consequences
### Positive:
- **Zero Schema Coupling**: Changes to product catalog or inventory schemas require zero migrations or downtime for the order or auth services.
- **Independent Scaling**: Read-heavy product catalog traffic does not degrade ACID transactional throughput in order or payment processing.
- **Autonomous Deployments**: Services can be developed, tested, containerized, and deployed completely independently.

### Tradeoffs & Mitigations:
- **No Cross-Database Foreign Keys**: Resolved via Saga Orchestration and Kafka asynchronous domain event streams (`order.created`, `payment.completed`, `inventory.reserved`).
- **Distributed Queries**: Solved by caching denormalized views and utilizing OpenSearch / Reciprocal Rank Fusion aggregations.
