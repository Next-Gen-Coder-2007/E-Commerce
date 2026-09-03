# ADR 006: OpenTelemetry Distributed Tracing & Prometheus Telemetry

## Status
**Accepted** (Implemented in `gateway/middleware/telemetry.js`, `services/shared/telemetry/`, and Prometheus/Grafana)

## Context
Debugging distributed transactions spanning multiple services (Gateway -> Order -> Payment -> Kafka -> Inventory -> Notification) is virtually impossible using isolated console logs. Without end-to-end trace correlation and real-time operational metrics, diagnosing p99 latency spikes and localized failure bottlenecks takes hours of manual log scraping.

## Decision
We implemented **Unified OpenTelemetry Tracing & Prometheus Telemetry**:
1. **W3C TraceContext Propagation**:
   - The API Gateway generates or forwards standard W3C `traceparent` (`00-${traceId}-${spanId}-${traceFlags}`) and `correlation-id` headers.
   - Microservices propagate this trace context across synchronous HTTP boundaries and asynchronous Apache Kafka message headers (`traceparent` header in Kafka record metadata).
2. **Prometheus Operational Metrics**:
   - Standard `/metrics` scrapers on the API Gateway and microservices recording:
     - `http_requests_total` (counter partitioned by method, route, status code)
     - `http_request_duration_ms` (histograms with p50, p90, p95, p99 percentiles)
     - `active_requests` (gauge for concurrent load)
     - `kafka_consumer_lag` and `redis_cache_hits_total`
3. **Automated Grafana Dashboards**:
   - Pre-provisioned dashboards in `monitoring/grafana/` visualizing service mesh health, latency percentiles, error rates, and checkout throughput.

## Consequences
### Positive:
- **Full Request Traceability**: Operators can trace any request from the React frontend through the API Gateway down to async Kafka background workers with a single `traceId`.
- **Proactive Anomaly Detection**: Real-time alerts on p99 latency regressions and error rate surges before customers submit support tickets.
- **Vendor Agnostic**: OpenTelemetry standards allow zero-code-change switching between Jaeger, Zipkin, AWS X-Ray, Datadog, or Grafana Tempo.

### Tradeoffs:
- Minor overhead in header serializations and metric increments (mitigated with sub-millisecond in-memory atomic aggregations).
