import CircuitBreaker from '../../shared/resilience/circuitBreaker.js';

const INVENTORY_SERVICE_URL =
  process.env.INVENTORY_SERVICE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5007');

class InventoryClient {
  constructor(baseUrl = INVENTORY_SERVICE_URL) {
    this.baseUrl = baseUrl;
    this.circuitBreaker = new CircuitBreaker('inventory-service', {
      failureThreshold: 4,
      resetTimeoutMs: 12000,
      fallback: (err) => ({
        ok: false,
        status: 503,
        error: err.message,
        data: { message: `[Circuit Breaker Active] Inventory service unavailable: ${err.message}` },
      }),
    });
  }

  async reserveStock({ orderId, items, ttlSeconds = 900, correlationId, traceId }) {
    return this.circuitBreaker.execute(async () => {
      const response = await fetch(`${this.baseUrl}/api/inventory/reserve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId || '',
          'x-trace-id': traceId || '',
        },
        body: JSON.stringify({ orderId, items, ttlSeconds }),
      });

      const data = await response.json();
      return {
        ok: response.ok,
        status: response.status,
        data,
      };
    });
  }

  async commitReservation({ orderId, reservationId, items, correlationId, traceId }) {
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/commit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId || '',
          'x-trace-id': traceId || '',
        },
        body: JSON.stringify({ orderId, reservationId, items }),
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
        data: { message: `Inventory service unreachable: ${err.message}` },
      };
    }
  }

  async releaseReservation({ orderId, reservationId, items, reason, correlationId, traceId }) {
    try {
      const response = await fetch(`${this.baseUrl}/api/inventory/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-correlation-id': correlationId || '',
          'x-trace-id': traceId || '',
        },
        body: JSON.stringify({ orderId, reservationId, items, reason }),
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
        data: { message: `Inventory service unreachable: ${err.message}` },
      };
    }
  }
}

export const inventoryClient = new InventoryClient();
export default inventoryClient;
