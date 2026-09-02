/**
 * Prometheus Standard Metrics Registry & Collector
 */
class MetricsRegistry {
  constructor(serviceName = 'microservice') {
    this.serviceName = serviceName;
    this.httpRequestsTotal = new Map(); // key: "method|route|status" -> count
    this.httpDurationBuckets = new Map(); // key: "method|route|bucket" -> count
    this.httpDurationSum = new Map(); // key: "method|route" -> sum
    this.httpDurationCount = new Map(); // key: "method|route" -> count
    this.kafkaProducedTotal = new Map(); // key: "topic|eventType" -> count
    this.kafkaConsumedTotal = new Map(); // key: "topic|eventType" -> count
    this.sagaExecutionsTotal = new Map(); // key: "status" -> count
    this.startTime = Date.now();

    this.buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10];
  }

  recordHttpRequest(method, route, statusCode, durationSeconds) {
    const cleanRoute = route || 'unknown_route';
    const cleanMethod = (method || 'GET').toUpperCase();
    const status = String(statusCode || 200);

    // 1. Increment http_requests_total
    const reqKey = `${cleanMethod}|${cleanRoute}|${status}`;
    this.httpRequestsTotal.set(reqKey, (this.httpRequestsTotal.get(reqKey) || 0) + 1);

    // 2. Record duration histogram
    const routeKey = `${cleanMethod}|${cleanRoute}`;
    this.httpDurationCount.set(routeKey, (this.httpDurationCount.get(routeKey) || 0) + 1);
    this.httpDurationSum.set(routeKey, (this.httpDurationSum.get(routeKey) || 0) + durationSeconds);

    for (const b of this.buckets) {
      if (durationSeconds <= b) {
        const bucketKey = `${cleanMethod}|${cleanRoute}|${b}`;
        this.httpDurationBuckets.set(bucketKey, (this.httpDurationBuckets.get(bucketKey) || 0) + 1);
      }
    }
  }

  recordKafkaProduced(topic, eventType) {
    const key = `${topic}|${eventType}`;
    this.kafkaProducedTotal.set(key, (this.kafkaProducedTotal.get(key) || 0) + 1);
  }

  recordKafkaConsumed(topic, eventType) {
    const key = `${topic}|${eventType}`;
    this.kafkaConsumedTotal.set(key, (this.kafkaConsumedTotal.get(key) || 0) + 1);
  }

  recordSagaExecution(status) {
    this.sagaExecutionsTotal.set(status, (this.sagaExecutionsTotal.get(status) || 0) + 1);
  }

  /**
   * Serialize metrics into standard Prometheus OpenMetrics text format
   */
  toPrometheusFormat() {
    const lines = [];
    const service = this.serviceName;

    // Process uptime
    const uptimeSeconds = ((Date.now() - this.startTime) / 1000).toFixed(2);
    lines.push(`# HELP process_uptime_seconds Total seconds the process has been running.`);
    lines.push(`# TYPE process_uptime_seconds gauge`);
    lines.push(`process_uptime_seconds{service="${service}"} ${uptimeSeconds}`);

    // HTTP Requests Total
    lines.push(`# HELP http_requests_total Total number of HTTP requests processed.`);
    lines.push(`# TYPE http_requests_total counter`);
    for (const [key, count] of this.httpRequestsTotal.entries()) {
      const [method, route, status] = key.split('|');
      lines.push(
        `http_requests_total{service="${service}",method="${method}",route="${route}",status="${status}"} ${count}`
      );
    }

    // HTTP Duration Seconds
    lines.push(`# HELP http_request_duration_seconds HTTP request execution latency in seconds.`);
    lines.push(`# TYPE http_request_duration_seconds histogram`);
    for (const [routeKey, count] of this.httpDurationCount.entries()) {
      const [method, route] = routeKey.split('|');
      const sum = (this.httpDurationSum.get(routeKey) || 0).toFixed(4);

      let cumulative = 0;
      for (const b of this.buckets) {
        const bCount = this.httpDurationBuckets.get(`${routeKey}|${b}`) || 0;
        cumulative += bCount;
        lines.push(
          `http_request_duration_seconds_bucket{service="${service}",method="${method}",route="${route}",le="${b}"} ${cumulative}`
        );
      }
      lines.push(
        `http_request_duration_seconds_bucket{service="${service}",method="${method}",route="${route}",le="+Inf"} ${count}`
      );
      lines.push(
        `http_request_duration_seconds_sum{service="${service}",method="${method}",route="${route}"} ${sum}`
      );
      lines.push(
        `http_request_duration_seconds_count{service="${service}",method="${method}",route="${route}"} ${count}`
      );
    }

    // Kafka Metrics
    if (this.kafkaProducedTotal.size > 0) {
      lines.push(`# HELP kafka_messages_produced_total Total Kafka events produced.`);
      lines.push(`# TYPE kafka_messages_produced_total counter`);
      for (const [key, count] of this.kafkaProducedTotal.entries()) {
        const [topic, eventType] = key.split('|');
        lines.push(
          `kafka_messages_produced_total{service="${service}",topic="${topic}",eventType="${eventType}"} ${count}`
        );
      }
    }

    if (this.kafkaConsumedTotal.size > 0) {
      lines.push(`# HELP kafka_messages_consumed_total Total Kafka events consumed.`);
      lines.push(`# TYPE kafka_messages_consumed_total counter`);
      for (const [key, count] of this.kafkaConsumedTotal.entries()) {
        const [topic, eventType] = key.split('|');
        lines.push(
          `kafka_messages_consumed_total{service="${service}",topic="${topic}",eventType="${eventType}"} ${count}`
        );
      }
    }

    // Saga Metrics
    if (this.sagaExecutionsTotal.size > 0) {
      lines.push(`# HELP saga_transactions_total Total distributed saga checkout executions.`);
      lines.push(`# TYPE saga_transactions_total counter`);
      for (const [status, count] of this.sagaExecutionsTotal.entries()) {
        lines.push(`saga_transactions_total{service="${service}",status="${status}"} ${count}`);
      }
    }

    return lines.join('\n') + '\n';
  }
}

/**
 * Express Middleware for recording HTTP metrics
 */
export const metricsMiddleware = (registry) => {
  return (req, res, next) => {
    const startTime = process.hrtime();

    res.on('finish', () => {
      const diff = process.hrtime(startTime);
      const durationSeconds = diff[0] + diff[1] / 1e9;
      const route = req.route?.path || req.baseUrl || req.path || 'unknown_route';
      registry.recordHttpRequest(req.method, route, res.statusCode, durationSeconds);
    });

    next();
  };
};

export const createMetricsRegistry = (serviceName) => new MetricsRegistry(serviceName);
export default MetricsRegistry;
