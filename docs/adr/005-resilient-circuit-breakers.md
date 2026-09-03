# ADR 005: Resilient Inter-Service Communication & Circuit Breaker Pattern

## Status
**Accepted** (Implemented in `services/shared/resilience/circuitBreaker.js` and inter-service HTTP clients)

## Context
In a distributed microservice marketplace, downstream network delays, temporary outages, or third-party payment gateway latency can cascade backwards, exhausting connection pools and thread pools in caller services (e.g. `order-service` calling `payment-service` or `inventory-service`). Synchronous retries without backoff or trip logic exacerbate load on failing services (thundering herd problem).

## Decision
We implemented **Stateful Circuit Breakers with Exponential Backoff & Jitter**:
1. **Tri-State Finite State Machine**:
   - **`CLOSED`**: Requests execute normally. Failure rates and latencies are recorded in a 10-second rolling sliding window.
   - **`OPEN`**: When failure rate exceeds 50% or error thresholds are reached, the breaker trips to `OPEN`. Subsequent requests fail fast immediately (<1ms) returning fallback responses or structured error envelopes without attempting downstream network calls.
   - **`HALF_OPEN`**: After a configurable cooldown window (e.g. 10s), the breaker transitions to `HALF_OPEN`, allowing a controlled trial probe of requests through. If probes succeed, the breaker resets to `CLOSED`; if any probe fails, it trips back to `OPEN`.
2. **Exponential Backoff with Jitter**:
   - Transient network glitches are retried with randomized jitter:
     $$T_{\text{wait}} = \text{base} \times 2^{\text{attempt}} + \text{random}(0, \text{jitter})$$
3. **Dead Letter Queue (DLQ) Fallback**:
   - Unrecoverable events after maximum retry limits are published to Kafka `*-dlq` topics (`payment-dlq`, `inventory-dlq`) with execution metadata and stack traces for operator inspection and replay.

## Consequences
### Positive:
- **Cascade Failure Prevention**: Isolates failures within the affected service domain, preventing whole-system blackout.
- **Fail-Fast Latency**: Prevents client requests from hanging for 30+ seconds during partial outages.
- **Self-Healing**: System automatically recovers to normal throughput as soon as degraded downstream dependencies become healthy again.

### Tradeoffs:
- Fallback logic must be carefully designed per endpoint so users receive clear status notifications (e.g. "Order accepted for asynchronous processing").
