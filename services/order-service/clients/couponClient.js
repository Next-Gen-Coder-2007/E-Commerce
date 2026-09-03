/**
 * Dedicated Cross-Service Client for Coupon Operations
 * Encapsulates timeout control, correlation-id propagation, error logging, and resilient fallback.
 */

const PRODUCT_SERVICE_URL =
  process.env.PRODUCT_SERVICE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5002');
const DEFAULT_TIMEOUT_MS = parseInt(process.env.HTTP_CLIENT_TIMEOUT_MS, 10) || 5000;

export class CouponServiceClient {
  constructor(baseUrl = PRODUCT_SERVICE_URL, timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
  }

  /**
   * Validate a promotional coupon code against items and subtotal
   */
  async validateCoupon({ code, cartItems, subtotal, userId, correlationId }) {
    if (!code) return { isValid: false, discountAmount: 0 };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(correlationId && { 'x-correlation-id': correlationId }),
          ...(userId && { 'x-user-id': userId.toString() }),
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          cartItems,
          subtotal,
          userId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          isValid: Boolean(data.isValid),
          discountAmount: Number(data.discountAmount) || 0,
          coupon: data.coupon || null,
          message: data.message || '',
        };
      }

      console.warn(`[CouponClient] Validation returned HTTP ${response.status}`);
      return { isValid: false, discountAmount: 0, message: 'Invalid coupon' };
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[CouponClient] Validation call warning (${err.name}): ${err.message}`);
      return { isValid: false, discountAmount: 0, error: err.message };
    }
  }

  /**
   * Record coupon redemption for a placed order
   */
  async redeemCoupon({ code, userId, orderId, discountAmount, correlationId }) {
    if (!code || !discountAmount) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}/api/coupons/redeem`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(correlationId && { 'x-correlation-id': correlationId }),
          ...(userId && { 'x-user-id': userId.toString() }),
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          userId,
          orderId,
          discountAmount,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }

      console.warn(`[CouponClient] Redemption returned HTTP ${response.status}`);
      return null;
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn(`[CouponClient] Redemption call warning: ${err.message}`);
      return null;
    }
  }
}

export const couponClient = new CouponServiceClient();
export default couponClient;
