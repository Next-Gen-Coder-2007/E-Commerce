# ADR 002: Distributed Saga Orchestration & Transactional Outbox Pattern

## Status
**Accepted** (Implemented in `order-service` with OrderSagaOrchestrator and Outbox Publishers)

## Context
With a Database-per-Service architecture, an order placement flow spans multiple distinct datastores (Order creation, Inventory two-phase lock reservation, Payment capture, and Notification dispatch). Two-Phase Commit (2PC) is brittle, slow, and unsuitable for high-throughput cloud environments.

## Decision
We implemented:
1. **Saga Orchestrator Pattern**:
   - `OrderSagaOrchestrator` centralizes forward execution (`PENDING_PAYMENT` -> `CONFIRMED` -> `PROCESSING`) and backward compensating transactions (`CANCELLED`, `COMPENSATING`, `REFUNDED`).
   - Disallows illegal backward jumps using deterministic state machine verification.
2. **Transactional Outbox Pattern**:
   - All domain events (`OrderCreated`, `PaymentCompleted`) are written atomically to a local `OutboxMessage` collection within the primary MongoDB database transaction.
   - A polling publisher background worker dispatches outbox events reliably to Apache Kafka, guaranteeing **at-least-once delivery** even during network partitions.

## Consequences
### Positive:
- **Eventual Consistency Without 2PC**: Resilient distributed consistency across isolated microservice datastores.
- **Auditable State Transitions**: Order history timelines maintain a tamper-evident audit record of every forward mutation and compensation.
- **Dual-Write Hazard Prevention**: The Transactional Outbox eliminates message-loss risks when database writes succeed but Kafka network calls fail.

### Tradeoffs:
- **Idempotency Requirement**: Consumers must implement deduplication via idempotency keys to handle at-least-once message replay.
