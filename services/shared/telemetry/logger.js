/**
 * Centralized Structured JSON Logger
 */
class StructuredLogger {
  constructor(serviceName = 'unknown-service') {
    this.serviceName = serviceName;
  }

  log(level, message, metadata = {}, traceContext = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      level: level.toUpperCase(),
      correlationId: traceContext.correlationId || metadata.correlationId || null,
      traceId: traceContext.traceId || metadata.traceId || null,
      spanId: traceContext.spanId || null,
      message,
      ...(Object.keys(metadata).length > 0 && { metadata }),
    };

    if (metadata instanceof Error) {
      entry.error = {
        name: metadata.name,
        message: metadata.message,
        stack: metadata.stack,
      };
    }

    const jsonLog = JSON.stringify(entry);
    if (level === 'error') {
      console.error(jsonLog);
    } else if (level === 'warn') {
      console.warn(jsonLog);
    } else {
      console.log(jsonLog);
    }
  }

  info(message, metadata, req) {
    this.log('info', message, metadata, req?.traceContext);
  }

  warn(message, metadata, req) {
    this.log('warn', message, metadata, req?.traceContext);
  }

  error(message, errorOrMetadata, req) {
    this.log('error', message, errorOrMetadata, req?.traceContext);
  }

  debug(message, metadata, req) {
    if (process.env.NODE_ENV !== 'production') {
      this.log('debug', message, metadata, req?.traceContext);
    }
  }
}

export const createLogger = (serviceName) => new StructuredLogger(serviceName);
export default StructuredLogger;
