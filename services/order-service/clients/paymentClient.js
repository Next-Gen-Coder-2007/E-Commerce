import CircuitBreaker from '../../shared/resilience/circuitBreaker.js';

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:5005';

class PaymentClient {
  constructor(baseUrl = PAYMENT_SERVICE_URL) {
    this.baseUrl = baseUrl;
    this.circuitBreaker = new CircuitBreaker('payment-service', {
      failureThreshold: 4,
      resetTimeoutMs: 12000,
      fallback: (err) => ({
        ok: false,
        status: 503,
        error: err.message,
        data: { message: `[Circuit Breaker Active] Payment service unavailable: ${err.message}` },
      }),
    });
  }

  async chargePayment({
    orderId,
    amount,
    currency = 'USD',
    paymentMethod = 'mock_instant',
    paymentDetails = {},
    userId,
    idempotencyKey,
    correlationId,
    traceId,
  }) {
    return this.circuitBreaker.execute(async () => {
      const response = await fetch(`${this.baseUrl}/api/payments/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey || '',
          'Idempotency-Key': idempotencyKey || '',
          'x-correlation-id': correlationId || '',
          'x-trace-id': traceId || '',
        },
        body: JSON.stringify({
          orderId,
          amount,
          currency,
          paymentMethod,
          paymentDetails,
          userId,
        }),
      });

      const data = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    });
  }

  async refundPayment({ orderId, transactionId, amount, reason, correlationId, traceId }) {
    try {
      const response = await fetch(`${this.baseUrl}/api/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId || '',
          'x-trace-id': traceId || '',
        },
        body: JSON.stringify({ orderId, transactionId, amount, reason }),
      });

      const data = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    } catch (err) {
      return {
        ok: false,
        status: 503,
        error: err.message,
        data: { message: `Payment service unreachable: ${err.message}` },
      };
    }
  }
}

export const paymentClient = new PaymentClient();
export default paymentClient;
