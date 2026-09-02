# ADR 004: Apache Kafka KRaft Event-Driven Topology

## Status
**Accepted** (Configured via `docker-compose.kafka.yml` and `services/shared/kafka/`)

## Context
Microservices need real-time, asynchronous communication for inventory deallocations, order status notifications, analytics, and auditing without blocking customer HTTP request cycles.

## Decision
We adopted **Apache Kafka in KRaft Mode** (ZooKeeper-less metadata management) with standard partition keys and dedicated topic topology:
- `order.events` (Partitions: 3) -> Key: `orderId`
- `inventory.events` (Partitions: 3) -> Key: `productId`
- `payment.events` (Partitions: 3) -> Key: `orderId`
- `product.events` (Partitions: 3) -> Key: `productId`
- `notification.events` (Partitions: 3) -> Key: `userId`

## Consequences
### Positive:
- **Strict Partition Ordering**: Partitioning by `orderId` ensures all state mutations for a specific order are processed sequentially by consumer groups.
- **ZooKeeper Elimination**: KRaft mode simplifies cluster operations, reduces memory footprint, and accelerates metadata quorum recovery.
- **Decoupled Asynchronous Workers**: The `notification-worker` consumes events and dispatches customer notifications without impacting primary checkout API latency.
