/**
 * Lightweight Enterprise Circuit Breaker for Distributed Microservices
 * Protects synchronous HTTP RPC calls from cascading failures.
 * States:
 *   - CLOSED: Normal operation, requests pass through.
 *   - OPEN: Failure threshold exceeded, requests fail fast with fallback.
 *   - HALF_OPEN: Cooldown elapsed, trial request sent to probe dependency health.
 */

export const CIRCUIT_STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN',
};

export class CircuitBreaker {
  /**
   * @param {string} serviceName Name of target downstream service
   * @param {Object} options Configuration options
   * @param {number} [options.failureThreshold=5] Consecutive failures to trip circuit
   * @param {number} [options.resetTimeoutMs=10000] Time in ms before entering HALF_OPEN state
   * @param {Function} [options.fallback] Default fallback function when OPEN
   */
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeoutMs = options.resetTimeoutMs || 10000;
    this.fallback = options.fallback || null;

    this.state = CIRCUIT_STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  /**
   * Execute an async action protected by this Circuit Breaker
   * @param {Function} action Async function returning a promise
   * @param {Function} [customFallback] Optional per-call fallback
   * @returns {Promise<any>}
   */
  async execute(action, customFallback = null) {
    const now = Date.now();

    // Check if OPEN circuit should transition to HALF_OPEN
    if (this.state === CIRCUIT_STATES.OPEN) {
      if (now >= this.nextAttemptTime) {
        this.state = CIRCUIT_STATES.HALF_OPEN;
        console.warn(`[CircuitBreaker:${this.serviceName}] Transitioned from OPEN to HALF_OPEN (probing...)`);
      } else {
        const err = new Error(`[CircuitBreaker:${this.serviceName}] Circuit is OPEN. Request failed fast.`);
        err.code = 'CIRCUIT_OPEN';

        if (customFallback) return customFallback(err);
        if (this.fallback) return this.fallback(err);
        throw err;
      }
    }

    try {
      const result = await action();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);

      if (customFallback) return customFallback(error);
      if (this.fallback) return this.fallback(error);
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === CIRCUIT_STATES.HALF_OPEN) {
      this.state = CIRCUIT_STATES.CLOSED;
      console.log(`[CircuitBreaker:${this.serviceName}] Target recovered. Transitioned to CLOSED.`);
    }
  }

  onFailure(error) {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();

    if (this.state === CIRCUIT_STATES.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.state = CIRCUIT_STATES.OPEN;
      this.nextAttemptTime = Date.now() + this.resetTimeoutMs;
      console.error(
        `[CircuitBreaker:${this.serviceName}] Tripped to OPEN! Failures: ${this.failureCount}. Cooldown: ${this.resetTimeoutMs}ms. Cause: ${error.message}`
      );
    }
  }

  getStatus() {
    return {
      service: this.serviceName,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : null,
      nextAttemptTime: this.nextAttemptTime ? new Date(this.nextAttemptTime).toISOString() : null,
    };
  }
}

export default CircuitBreaker;
